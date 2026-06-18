import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../utils/prisma.ts';
import { registrar } from '../utils/auditoria.ts';

const schemaCrear = z.object({
  nombre:    z.string().min(2).max(100),
  email:     z.string().email(),
  password:  z.string().min(8),
  rol:       z.enum(['ADMIN', 'ALMACENISTA', 'SUPERVISOR', 'SOLO_LECTURA']),
  almacenId: z.number().int().positive().optional().nullable(),
});

const schemaActualizar = schemaCrear.omit({ password: true }).partial().extend({
  password: z.string().min(8).optional(),
  activo:   z.boolean().optional(),
});

export async function listar(_req: Request, res: Response, next: NextFunction) {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, rol: true, activo: true, almacenId: true, creadoEn: true },
      orderBy: { nombre: 'asc' },
    });
    res.json({ ok: true, data: usuarios });
  } catch (e) { next(e); }
}

export async function obtener(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, rol: true, activo: true, almacenId: true },
    });
    if (!usuario) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }
    res.json({ ok: true, data: usuario });
  } catch (e) { next(e); }
}

export async function crear(req: Request, res: Response, next: NextFunction) {
  try {
    const body = schemaCrear.parse(req.body);
    const existe = await prisma.usuario.findUnique({ where: { email: body.email } });
    if (existe) { res.status(409).json({ ok: false, message: 'El email ya está registrado' }); return; }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const usuario = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.create({
        data: { nombre: body.nombre, email: body.email, passwordHash, rol: body.rol, almacenId: body.almacenId ?? null },
        select: { id: true, nombre: true, email: true, rol: true, almacenId: true },
      });
      await registrar(tx as any, req, 'CREAR', 'usuarios', u.id, undefined, { nombre: u.nombre, email: u.email, rol: u.rol });
      return u;
    });
    res.status(201).json({ ok: true, data: usuario });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

export async function actualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const body = schemaActualizar.parse(req.body);

    const anterior = await prisma.usuario.findUnique({ where: { id } });
    if (!anterior) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }
    if (anterior.id === req.user!.id && body.activo === false) {
      res.status(400).json({ ok: false, message: 'No puedes desactivar tu propia cuenta' }); return;
    }

    const data: Record<string, unknown> = { ...body };
    if (body.password) { data.passwordHash = await bcrypt.hash(body.password, 12); }
    delete data.password;

    const usuario = await prisma.$transaction(async (tx) => {
      const u = await tx.usuario.update({ where: { id }, data, select: { id: true, nombre: true, email: true, rol: true, activo: true } });
      await registrar(tx as any, req, 'ACTUALIZAR', 'usuarios', id, anterior, u);
      return u;
    });
    res.json({ ok: true, data: usuario });
  } catch (e: any) {
    if (e.name === 'ZodError') { res.status(400).json({ ok: false, message: e.errors[0].message }); return; }
    next(e);
  }
}

export async function eliminar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (id === req.user!.id) { res.status(400).json({ ok: false, message: 'No puedes eliminar tu propia cuenta' }); return; }
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) { res.status(404).json({ ok: false, message: 'Usuario no encontrado' }); return; }
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data: { activo: false } });
      await registrar(tx as any, req, 'DESACTIVAR', 'usuarios', id, usuario);
    });
    res.json({ ok: true, message: 'Usuario desactivado' });
  } catch (e) { next(e); }
}
