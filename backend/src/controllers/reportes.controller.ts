import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma.ts';

export async function stock(req: Request, res: Response, next: NextFunction) {
  try {
    const { almacenId } = req.query;
    const where = almacenId ? { almacenId: Number(almacenId) } : {};

    const items = await prisma.stock.findMany({
      where,
      include: {
        almacen:  { select: { id: true, nombre: true, proyecto: true } },
        material: { include: { categoria: { select: { nombre: true } } } },
      },
      orderBy: [{ almacen: { nombre: 'asc' } }, { material: { nombre: 'asc' } }],
    });

    res.json({ ok: true, data: items });
  } catch (e) { next(e); }
}

export async function movimientos(req: Request, res: Response, next: NextFunction) {
  try {
    const { almacenId, desde, hasta, tipo } = req.query;
    const dateFilter = {
      ...(desde ? { gte: new Date(String(desde)) } : {}),
      ...(hasta ? { lte: new Date(String(hasta)) } : {}),
    };
    const almFilter = almacenId ? { almacenId: Number(almacenId) } : {};
    const fechaFilter = Object.keys(dateFilter).length ? { fecha: dateFilter } : {};

    const [entradas, salidas, transferencias] = await Promise.all([
      (!tipo || tipo === 'entrada') ? prisma.entrada.findMany({
        where: { ...almFilter, ...fechaFilter },
        select: { id: true, folio: true, fecha: true, almacen: { select: { nombre: true } }, proveedor: true },
        orderBy: { fecha: 'desc' },
      }) : Promise.resolve([]),

      (!tipo || tipo === 'salida') ? prisma.salida.findMany({
        where: { ...almFilter, ...fechaFilter },
        select: { id: true, folio: true, fecha: true, estado: true, almacen: { select: { nombre: true } }, tramo: true },
        orderBy: { fecha: 'desc' },
      }) : Promise.resolve([]),

      (!tipo || tipo === 'transferencia') ? prisma.transferencia.findMany({
        where: { ...(almacenId ? { OR: [{ almacenOrigenId: Number(almacenId) }, { almacenDestinoId: Number(almacenId) }] } : {}), ...fechaFilter },
        select: { id: true, folio: true, fecha: true, estado: true, almacenOrigen: { select: { nombre: true } }, almacenDestino: { select: { nombre: true } } },
        orderBy: { fecha: 'desc' },
      }) : Promise.resolve([]),
    ]);

    res.json({
      ok: true,
      data: {
        entradas:       entradas.map((e) => ({ ...e, tipo: 'ENTRADA' })),
        salidas:        salidas.map((s) => ({ ...s, tipo: 'SALIDA' })),
        transferencias: transferencias.map((t) => ({ ...t, tipo: 'TRANSFERENCIA' })),
      },
    });
  } catch (e) { next(e); }
}

export async function general(_req: Request, res: Response, next: NextFunction) {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [almacenes, entradasHoy, salidasPendientes, materialesBajoMinimo] = await Promise.all([
      prisma.almacen.count({ where: { activo: true } }),
      prisma.entrada.count({ where: { fecha: { gte: hoy } } }),
      prisma.salida.count({ where: { retornable: true, estado: { in: ['ACTIVA', 'RETORNO_PARCIAL'] } } }),
      prisma.stock.count({
        where: { cantidadActual: { lte: prisma.stock.fields.cantidadActual } },
      }).catch(() => 0),
    ]);

    // Stock bajo mínimo (comparación manual)
    const stockItems = await prisma.stock.findMany({
      include: { material: { select: { stockMinimo: true } } },
    });
    const bajoMinimo = stockItems.filter((s) => s.cantidadActual <= s.material.stockMinimo).length;

    res.json({
      ok: true,
      data: { almacenesActivos: almacenes, entradasHoy, salidasPendientes, materialesBajoMinimo: bajoMinimo },
    });
  } catch (e) { next(e); }
}
