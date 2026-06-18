import api from './api.ts';
import type { Almacen, StockItem } from '../types/index.ts';

export const almacenesService = {
  listar: () =>
    api.get<{ ok: boolean; data: Almacen[] }>('/almacenes').then((r) => r.data.data),

  obtener: (id: number) =>
    api.get<{ ok: boolean; data: Almacen }>(`/almacenes/${id}`).then((r) => r.data.data),

  crear: (body: Partial<Almacen>) =>
    api.post<{ ok: boolean; data: Almacen }>('/almacenes', body).then((r) => r.data.data),

  actualizar: (id: number, body: Partial<Almacen>) =>
    api.put<{ ok: boolean; data: Almacen }>(`/almacenes/${id}`, body).then((r) => r.data.data),

  stock: (id: number) =>
    api.get<{ ok: boolean; data: StockItem[] }>(`/almacenes/${id}/stock`).then((r) => r.data.data),
};
