import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.ts';

function signAccess(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as string });
}

function signRefresh(payload: object) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string });
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ ok: false, message: 'Email y contraseña requeridos' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, usuario.passwordHash);
    if (!valid) {
      res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
      return;
    }

    const payload = { id: usuario.id, rol: usuario.rol, almacenId: usuario.almacenId };
    const accessToken  = signAccess(payload);
    const refreshToken = signRefresh({ id: usuario.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.sessionToken.create({ data: { token: refreshToken, usuarioId: usuario.id, expiresAt } });

    res.json({
      ok: true,
      accessToken,
      refreshToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.sessionToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ ok: true, message: 'Sesión cerrada' });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ ok: false, message: 'Refresh token requerido' });
      return;
    }

    let decoded: { id: number };
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: number };
    } catch {
      res.status(401).json({ ok: false, message: 'Refresh token inválido' });
      return;
    }

    const session = await prisma.sessionToken.findUnique({ where: { token: refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ ok: false, message: 'Sesión expirada' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({ where: { id: decoded.id } });
    if (!usuario || !usuario.activo) {
      res.status(401).json({ ok: false, message: 'Usuario inactivo' });
      return;
    }

    await prisma.sessionToken.delete({ where: { token: refreshToken } });
    const newRefresh = signRefresh({ id: usuario.id });
    const newAccess  = signAccess({ id: usuario.id, rol: usuario.rol, almacenId: usuario.almacenId });
    const expiresAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.sessionToken.create({ data: { token: newRefresh, usuarioId: usuario.id, expiresAt } });

    res.json({ ok: true, accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) {
    next(e);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      select: { id: true, nombre: true, email: true, rol: true, almacenId: true },
    });
    if (!usuario) {
      res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
      return;
    }
    res.json({ ok: true, usuario });
  } catch (e) {
    next(e);
  }
}
