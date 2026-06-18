import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.ts';
import { folioSalida } from '../utils/folio.ts';
import { decrementarStock, incrementarStock } from '../utils/stock.ts';
import { registrar } from '../utils/auditoria.ts';

const schemaCrear = z.object({
  almacenId:  z.number().int().positive(),
  tramo:      z.string().min(1).max(100),
  solicito:   z.string().min(2).max(100),
  recibio:    z.string().min(2).max(100),
  entrego:    z.string().min(2).max(100),
  comentario: z.string().max(1000).optional().nullable(),
  retornable: z.boolean().default(false),
  detalle: z.array(z.object({
    materialId: z.number().int().positive(),
    cantidad:   z.number().int().positive(),
  })).min(1),
});

const schemaRetornar = z.object({
  detalle: z.array(z.object({
    materialId:       z.number().int().positive(),
    cantidadRetorno:  z.number().int().positive(),
  })).min(1),
});

const includeBase = {
  almacen:  { select: { id: true, nombre: true, proyecto: true } },
  creadoPor: { select: { id: true, nombre: true } },
  detalle:  { include: { material: { select: { id: true, nombre: true, unidadMedida: true } } } },
};

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const { almacenId, estado, retornable, desde, hasta, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Record<string, unknown> = {};
    if (almacenId)  where.almacenId  = Number(almacenId);
    if (estado)     where.estado     = String(estado);
    if (retornable !== undefined) where.retornable = retornable === 'true';
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(String(desde)) } : {}),
        ...(hasta ? { lte: new Date(String(hasta)) } : {}),
      };
    }

    const [total, salidas] = await Promise.all([
      prisma.salida.count({ where }),
      prisma.salida.findMany({ where, include: includeBase, orderBy: { fecha: 'desc' }, skip, take: Number(pageSize) }),
    ]);
    res.json({ ok: true, data: salidas, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const salida = await prisma.salida.findUnique({ where: { id }, include: includeBase });
    if (!salida) { res.status(404).json({ ok: false, message: 'Salida no encontrada' }); return; }
    res.json({ ok: true, data: salida });
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaCrear.parse(req.body);

    const almacen = await prisma.almacen.findUnique({ where: { id: body.almacenId } });
    if (!almacen || !almacen.activo) { res.status(404).json({ ok: false, message: 'Almacén no encontrado o inactivo' }); return; }

    const folio = await folioSalida(almacen.nombre, almacen.proyecto);

    const salida = await prisma.$transaction(async (tx) => {
      await decrementarStock(tx as any, body.almacenId, body.detalle);

      const s = await tx.salida.create({
        data: {
          folio,
          tramo:      body.tramo,
          solicito:   body.solicito,
          recibio:    body.recibio,
          entrego:    body.entrego,
          comentario: body.comentario,
          retornable: body.retornable,
          almacenId:  body.almacenId,
          creadoPorId: req.user!.id,
          detalle: {
            create: body.detalle.map(({ materialId, cantidad }) => ({
              materialId,
              cantidadSolicitada: cantidad,
              cantidadRetornada:  0,
            })),
          },
        },
        include: includeBase,
      });

      await registrar(tx as any, req, 'CREAR', 'salidas', s.id, undefined, { folio, almacenId: body.almacenId });
      return s;
    });

    res.status(201).json({ ok: true, data: salida });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    if (e.status) { res.status(e.status).json({ ok: false, message: e.message }); return; }
    next(e);
  }
}

export async function retornar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const body = schemaRetornar.parse(req.body);

    const salida = await prisma.salida.findUnique({ where: { id }, include: { detalle: true } });
    if (!salida) { res.status(404).json({ ok: false, message: 'Salida no encontrada' }); return; }
    if (!salida.retornable) { res.status(400).json({ ok: false, message: 'Esta salida no fue marcada como retornable' }); return; }
    if (salida.estado === 'RETORNO_TOTAL') { res.status(400).json({ ok: false, message: 'Salida ya tiene retorno total' }); return; }

    // Validar que no se retorne más de lo pendiente
    for (const ret of body.detalle) {
      const item = salida.detalle.find((d) => d.materialId === ret.materialId);
      if (!item) { res.status(400).json({ ok: false, message: `Material ${ret.materialId} no pertenece a esta salida` }); return; }
      const pendiente = item.cantidadSolicitada - item.cantidadRetornada;
      if (ret.cantidadRetorno > pendiente) {
        res.status(422).json({ ok: false, message: `Retorno excede pendiente para material ${ret.materialId}. Pendiente: ${pendiente}` });
        return;
      }
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      // Actualizar cada línea de detalle
      for (const ret of body.detalle) {
        await tx.salidaDetalle.updateMany({
          where: { salidaId: id, materialId: ret.materialId },
          data: { cantidadRetornada: { increment: ret.cantidadRetorno } },
        });
      }

      // Reintegrar al stock
      await incrementarStock(tx as any, salida.almacenId, body.detalle.map((r) => ({ materialId: r.materialId, cantidad: r.cantidadRetorno })));

      // Recalcular estado de la salida
      const detalleActualizado = await tx.salidaDetalle.findMany({ where: { salidaId: id } });
      const todosRetornados = detalleActualizado.every((d) => d.cantidadRetornada >= d.cantidadSolicitada);
      const nuevoEstado = todosRetornados ? 'RETORNO_TOTAL' : 'RETORNO_PARCIAL';

      const s = await tx.salida.update({ where: { id }, data: { estado: nuevoEstado }, include: includeBase });
      await registrar(tx as any, req, 'RETORNO', 'salidas', id, { estado: salida.estado }, { estado: nuevoEstado });
      return s;
    });

    res.json({ ok: true, data: actualizado });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    if (e.status) { res.status(e.status).json({ ok: false, message: e.message }); return; }
    next(e);
  }
}
