import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Admin por defecto
  const hash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@inventario.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@inventario.com',
      passwordHash: hash,
      rol: 'ADMIN',
    },
  });
  console.log(`Usuario admin: ${admin.email}`);

  // Categorías base
  const categorias = [
    { nombre: 'Herramienta', descripcion: 'Herramientas manuales y eléctricas' },
    { nombre: 'Material eléctrico', descripcion: 'Cables, conectores, tableros' },
    { nombre: 'Material civil', descripcion: 'Cemento, varilla, block, arena' },
    { nombre: 'Equipo de protección', descripcion: 'Cascos, guantes, chalecos, botas' },
    { nombre: 'Consumible', descripcion: 'Tornillos, tuercas, cinta, selladores' },
    { nombre: 'Tubería y conexiones', descripcion: 'PVC, CPVC, acero, codos, tees' },
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: cat,
    });
  }
  console.log(`Categorías creadas: ${categorias.length}`);

  // Almacén de ejemplo
  const almacen = await prisma.almacen.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombre: 'Almacén Central',
      proyecto: 'Proyecto Demo',
      responsableId: admin.id,
    },
  });
  console.log(`Almacén: ${almacen.nombre}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
