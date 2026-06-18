import api from './api.ts';
import type { Material, Categoria } from '../types/index.ts';

export const materialesService = {
  listar: (params?: { categoriaId?: number; q?: string }) =>
    api.get<{ ok: boolean; data: Material[] }>('/materiales', { params }).then((r) => r.data.data),

  obtener: (id: number) =>
    api.get<{ ok: boolean; data: Material }>(`/materiales/${id}`).then((r) => r.data.data),

  crear: (body: Partial<Material>) =>
    api.post<{ ok: boolean; data: Material }>('/materiales', body).then((r) => r.data.data),

  actualizar: (id: number, body: Partial<Material>) =>
    api.put<{ ok: boolean; data: Material }>(`/materiales/${id}`, body).then((r) => r.data.data),

  listarCategorias: () =>
    api.get<{ ok: boolean; data: Categoria[] }>('/materiales/categorias').then((r) => r.data.data),

  crearCategoria: (body: { nombre: string; descripcion?: string }) =>
    api.post<{ ok: boolean; data: Categoria }>('/materiales/categorias', body).then((r) => r.data.data),
};
