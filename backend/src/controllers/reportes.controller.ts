import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.ts";

export const stock       = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: [] }); } catch(e) { next(e); } };
export const movimientos = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: [] }); } catch(e) { next(e); } };
export const general     = async (_req: Request, res: Response, next: NextFunction) => { try { res.json({ ok: true, data: [] }); } catch(e) { next(e); } };
