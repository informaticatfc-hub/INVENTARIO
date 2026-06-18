import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.ts';
import { registrar } from '../utils/auditoria.ts';

const schemaMaterial = z.object({
  nombre:       z.string().min(2).max(150),
  unidadMedida: z.string().min(1).max(30),
  descripcion:  z.string().max(255).optional().nullable(),
  stockMinimo:  z.number().int().min(0).default(0),
  categoriaId:  z.number().int().positive(),
});

const schemaCategoria = z.object({
  nombre:      z.string().min(2).max(100),
  descripcion: z.string().max(255).optional().nullable(),
});

const includeBase = { categoria: { select: { id: true, nombre: true } } };

// ── Materiales ────────────────────────────────────────────────

export async function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const { categoriaId, activo, q } = req.query;
    const materiales = await prisma.material.findMany({
      where: {
        activo:     activo !== undefined ? activo === 'true' : undefined,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        nombre:     q ? { contains: String(q) } : undefined,
      },
      include: includeBase,
      orderBy: { nombre: 'asc' },
    });
    res.json({ ok: true, data: materiales });
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const material = await prisma.material.findUnique({ where: { id }, include: includeBase });
    if (!material) { res.status(404).json({ ok: false, message: 'Material no encontrado' }); return; }
    res.json({ ok: true, data: material });
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaMaterial.parse(req.body);
    const material = await prisma.$transaction(async (tx) => {
      const m = await tx.material.create({ data: body, include: includeBase });
      await registrar(tx as any, req, 'CREAR', 'materiales', m.id, undefined, body);
      return m;
    });
    res.status(201).json({ ok: true, data: material });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const body = schemaMaterial.partial().parse(req.body);
    const anterior = await prisma.material.findUnique({ where: { id } });
    if (!anterior) { res.status(404).json({ ok: false, message: 'Material no encontrado' }); return; }

    const material = await prisma.$transaction(async (tx) => {
      const m = await tx.material.update({ where: { id }, data: body, include: includeBase });
      await registrar(tx as any, req, 'ACTUALIZAR', 'materiales', id, anterior, body);
      return m;
    });
    res.json({ ok: true, data: material });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

// ── Categorías ────────────────────────────────────────────────

export async function listarCategorias(_req: Request, res: Response, next: NextFunction) {
  try {
    const categorias = await prisma.categoria.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } });
    res.json({ ok: true, data: categorias });
  } catch (e) { next(e); }
}

export async function crearCategoria(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaCategoria.parse(req.body);
    const categoria = await prisma.categoria.create({ data: body });
    res.status(201).json({ ok: true, data: categoria });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    if (e.code === 'P2002') { res.status(409).json({ ok: false, message: 'Ya existe una categoría con ese nombre' }); return; }
    next(e);
  }
}
