import api from './api.ts';
import type { Entrada, Salida } from '../types/index.ts';

interface PaginatedRes<T> { ok: boolean; data: T[]; total: number; page: number; pageSize: number; }
interface CrearEntradaBody { almacenId: number; proveedor: string; comentario?: string; detalle: { materialId: number; cantidad: number }[]; }
interface CrearSalidaBody { almacenId: number; tramo: string; solicito: string; recibio: string; entrego: string; comentario?: string; retornable: boolean; detalle: { materialId: number; cantidad: number }[]; }
interface RetornarBody { detalle: { materialId: number; cantidadRetorno: number }[]; }

export const entradasService = {
  listar: (params?: object) =>
    api.get<PaginatedRes<Entrada>>('/entradas', { params }).then((r) => r.data),
  obtener: (id: number) =>
    api.get<{ ok: boolean; data: Entrada }>(`/entradas/${id}`).then((r) => r.data.data),
  crear: (body: CrearEntradaBody) =>
    api.post<{ ok: boolean; data: Entrada }>('/entradas', body).then((r) => r.data.data),
};

export const salidasService = {
  listar: (params?: object) =>
    api.get<PaginatedRes<Salida>>('/salidas', { params }).then((r) => r.data),
  obtener: (id: number) =>
    api.get<{ ok: boolean; data: Salida }>(`/salidas/${id}`).then((r) => r.data.data),
  crear: (body: CrearSalidaBody) =>
    api.post<{ ok: boolean; data: Salida }>('/salidas', body).then((r) => r.data.data),
  retornar: (id: number, body: RetornarBody) =>
    api.patch<{ ok: boolean; data: Salida }>(`/salidas/${id}/retornar`, body).then((r) => r.data.data),
};

export const dashboardService = {
  general: () =>
    api.get<{ ok: boolean; data: { almacenesActivos: number; entradasHoy: number; salidasPendientes: number; materialesBajoMinimo: number } }>('/reportes/general').then((r) => r.data.data),
};
