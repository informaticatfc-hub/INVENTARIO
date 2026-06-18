import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.ts';
import { registrar } from '../utils/auditoria.ts';

const schemaCrear = z.object({
  nombre:       z.string().min(2).max(100),
  proyecto:     z.string().min(2).max(100),
  responsableId: z.number().int().positive().optional().nullable(),
});

const includeBase = {
  responsable: { select: { id: true, nombre: true } },
};

export async function listar(_req: Request, res: Response, next: NextFunction) {
  try {
    const almacenes = await prisma.almacen.findMany({
      include: includeBase,
      orderBy: { nombre: 'asc' },
    });
    res.json({ ok: true, data: almacenes });
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const almacen = await prisma.almacen.findUnique({ where: { id }, include: includeBase });
    if (!almacen) { res.status(404).json({ ok: false, message: 'Almacén no encontrado' }); return; }
    res.json({ ok: true, data: almacen });
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaCrear.parse(req.body);
    const almacen = await prisma.$transaction(async (tx) => {
      const a = await tx.almacen.create({ data: body, include: includeBase });
      await registrar(tx as any, req, 'CREAR', 'almacenes', a.id, undefined, body);
      return a;
    });
    res.status(201).json({ ok: true, data: almacen });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const body = schemaCrear.partial().parse(req.body);
    const anterior = await prisma.almacen.findUnique({ where: { id } });
    if (!anterior) { res.status(404).json({ ok: false, message: 'Almacén no encontrado' }); return; }

    const almacen = await prisma.$transaction(async (tx) => {
      const a = await tx.almacen.update({ where: { id }, data: body, include: includeBase });
      await registrar(tx as any, req, 'ACTUALIZAR', 'almacenes', id, anterior, body);
      return a;
    });
    res.json({ ok: true, data: almacen });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

export async function stock(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const almacen = await prisma.almacen.findUnique({ where: { id } });
    if (!almacen) { res.status(404).json({ ok: false, message: 'Almacén no encontrado' }); return; }

    const items = await prisma.stock.findMany({
      where: { almacenId: id },
      include: {
        material: {
          include: { categoria: { select: { id: true, nombre: true } } },
        },
      },
      orderBy: { material: { nombre: 'asc' } },
    });

    const data = items.map((s) => ({
      materialId:     s.materialId,
      nombre:         s.material.nombre,
      unidadMedida:   s.material.unidadMedida,
      categoria:      s.material.categoria.nombre,
      cantidadActual: s.cantidadActual,
      stockMinimo:    s.material.stockMinimo,
      bajoMinimo:     s.cantidadActual <= s.material.stockMinimo,
    }));

    res.json({ ok: true, data });
  } catch (e) { next(e); }
}
