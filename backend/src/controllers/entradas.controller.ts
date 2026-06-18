import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.ts';
import { folioEntrada } from '../utils/folio.ts';
import { incrementarStock } from '../utils/stock.ts';
import { registrar } from '../utils/auditoria.ts';

const schemaCrear = z.object({
  almacenId:  z.number().int().positive(),
  proveedor:  z.string().min(2).max(150),
  comentario: z.string().max(1000).optional().nullable(),
  detalle: z.array(z.object({
    materialId: z.number().int().positive(),
    cantidad:   z.number().int().positive(),
  })).min(1, 'Debe incluir al menos un material'),
});

const includeBase = {
  almacen:  { select: { id: true, nombre: true, proyecto: true } },
  autorizo: { select: { id: true, nombre: true } },
  detalle:  { include: { material: { select: { id: true, nombre: true, unidadMedida: true } } } },
};

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const { almacenId, desde, hasta, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: Record<string, unknown> = {};
    if (almacenId) where.almacenId = Number(almacenId);
    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(String(desde)) } : {}),
        ...(hasta ? { lte: new Date(String(hasta)) } : {}),
      };
    }

    const [total, entradas] = await Promise.all([
      prisma.entrada.count({ where }),
      prisma.entrada.findMany({ where, include: includeBase, orderBy: { fecha: 'desc' }, skip, take: Number(pageSize) }),
    ]);
    res.json({ ok: true, data: entradas, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const entrada = await prisma.entrada.findUnique({ where: { id }, include: includeBase });
    if (!entrada) { res.status(404).json({ ok: false, message: 'Entrada no encontrada' }); return; }
    res.json({ ok: true, data: entrada });
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaCrear.parse(req.body);

    const almacen = await prisma.almacen.findUnique({ where: { id: body.almacenId } });
    if (!almacen || !almacen.activo) { res.status(404).json({ ok: false, message: 'Almacén no encontrado o inactivo' }); return; }

    const folio = await folioEntrada(almacen.nombre, almacen.proyecto);

    const entrada = await prisma.$transaction(async (tx) => {
      const e = await tx.entrada.create({
        data: {
          folio,
          proveedor:  body.proveedor,
          comentario: body.comentario,
          almacenId:  body.almacenId,
          autorizoId: req.user!.id,
          creadoPorId: req.user!.id,
          detalle: { create: body.detalle.map(({ materialId, cantidad }) => ({ materialId, cantidad })) },
        },
        include: includeBase,
      });

      await incrementarStock(tx as any, body.almacenId, body.detalle);
      await registrar(tx as any, req, 'CREAR', 'entradas', e.id, undefined, { folio, almacenId: body.almacenId });
      return e;
    });

    res.status(201).json({ ok: true, data: entrada });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    if (e.status) { res.status(e.status).json({ ok: false, message: e.message }); return; }
    next(e);
  }
}
