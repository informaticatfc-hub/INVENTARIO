import { PrismaClient } from '@prisma/client';

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export interface ItemMovimiento {
  materialId: number;
  cantidad: number;
}

export async function incrementarStock(tx: Tx, almacenId: number, items: ItemMovimiento[]) {
  for (const { materialId, cantidad } of items) {
    await tx.stock.upsert({
      where: { almacenId_materialId: { almacenId, materialId } },
      update: { cantidadActual: { increment: cantidad } },
      create: { almacenId, materialId, cantidadActual: cantidad },
    });
  }
}

export async function decrementarStock(tx: Tx, almacenId: number, items: ItemMovimiento[]) {
  for (const { materialId, cantidad } of items) {
    const stock = await tx.stock.findUnique({
      where: { almacenId_materialId: { almacenId, materialId } },
    });

    if (!stock || stock.cantidadActual < cantidad) {
      const mat = await tx.material.findUnique({ where: { id: materialId }, select: { nombre: true } });
      throw Object.assign(
        new Error(`Stock insuficiente para "${mat?.nombre ?? materialId}". Disponible: ${stock?.cantidadActual ?? 0}`),
        { status: 422 }
      );
    }

    await tx.stock.update({
      where: { almacenId_materialId: { almacenId, materialId } },
      data: { cantidadActual: { decrement: cantidad } },
    });
  }
}
