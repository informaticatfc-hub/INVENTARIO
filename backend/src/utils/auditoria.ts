import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

type Tx = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function registrar(
  tx: Tx,
  req: Request,
  accion: string,
  tabla: string,
  registroId?: number,
  datosAnteriores?: object,
  datosNuevos?: object,
) {
  await tx.auditoria.create({
    data: {
      accion,
      tabla,
      registroId,
      datosAnteriores: datosAnteriores ?? undefined,
      datosNuevos: datosNuevos ?? undefined,
      ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.socket.remoteAddress,
      usuarioId: req.user?.id,
    },
  });
}
