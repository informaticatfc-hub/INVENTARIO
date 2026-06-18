export type Rol = 'ADMIN' | 'ALMACENISTA' | 'SUPERVISOR' | 'SOLO_LECTURA';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  almacenId: number | null;
}

export interface Almacen {
  id: number;
  nombre: string;
  proyecto: string;
  activo: boolean;
  responsableId: number | null;
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Material {
  id: number;
  nombre: string;
  unidadMedida: string;
  categoriaId: number;
  stockMinimo: number;
  activo: boolean;
}

export interface StockItem {
  materialId: number;
  material: Material;
  cantidadActual: number;
}

export interface MovimientoDetalle {
  materialId: number;
  material: Material;
  cantidad: number;
}

export interface Entrada {
  id: number;
  folio: string;
  proveedor: string;
  comentario: string | null;
  fecha: string;
  almacen: Almacen;
  detalle: MovimientoDetalle[];
}

export type EstadoSalida = 'ACTIVA' | 'RETORNO_PARCIAL' | 'RETORNO_TOTAL';

export interface Salida {
  id: number;
  folio: string;
  tramo: string;
  solicito: string;
  recibio: string;
  entrego: string;
  retornable: boolean;
  estado: EstadoSalida;
  fecha: string;
  almacen: Almacen;
  detalle: Array<MovimientoDetalle & { cantidadRetornada: number }>;
}

export type EstadoTransferencia = 'PENDIENTE' | 'ENVIADO' | 'RECIBIDO';

export interface Transferencia {
  id: number;
  folio: string;
  estado: EstadoTransferencia;
  solicito: string;
  entrego: string;
  fecha: string;
  almacenOrigen: Almacen;
  almacenDestino: Almacen;
  detalle: MovimientoDetalle[];
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
