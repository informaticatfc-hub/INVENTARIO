import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.ts";

export const listar        = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: [] }); } catch(e) { next(e); } };
export const obtener       = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: null }); } catch(e) { next(e); } };
export const crear         = async (_req: Request, res: Response, next: NextFunction) => { try { res.status(201).json({ ok: true, data: null }); } catch(e) { next(e); } };
export const cambiarEstado = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: null }); } catch(e) { next(e); } };
