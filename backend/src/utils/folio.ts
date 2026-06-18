import prisma from './prisma.ts';

function codigo(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, '').slice(0, 4);
}

async function siguienteSecuencia(prefijo: string): Promise<string> {
  const tablas = [
    prisma.entrada,
    prisma.salida,
    prisma.transferencia,
    prisma.perdida,
  ] as Array<{ count: (args: { where: { folio: { startsWith: string } } }) => Promise<number> }>;

  let max = 0;
  for (const tabla of tablas) {
    const n = await tabla.count({ where: { folio: { startsWith: prefijo } } });
    if (n > max) max = n;
  }
  return `${prefijo}-${String(max + 1).padStart(4, '0')}`;
}

export async function folioEntrada(almacenNombre: string, proyecto: string): Promise<string> {
  const prefijo = `${codigo(almacenNombre)}-${codigo(proyecto)}`;
  return siguienteSecuencia(prefijo);
}

export async function folioSalida(almacenNombre: string, proyecto: string): Promise<string> {
  return folioEntrada(almacenNombre, proyecto);
}

export async function folioPerdida(almacenNombre: string, proyecto: string): Promise<string> {
  return folioEntrada(almacenNombre, proyecto);
}

export async function folioTransferencia(origenNombre: string, destinoNombre: string): Promise<string> {
  const prefijo = `${codigo(origenNombre)}-${codigo(destinoNombre)}`;
  return siguienteSecuencia(prefijo);
}
