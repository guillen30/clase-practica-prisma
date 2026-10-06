import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { name: 'Clase practica' },
    update: {},
    create: { name: 'Clase practica' },
  });
  const password = await hash('Practica123!', 10);
  for (const [email, name, role] of [
    ['admin@clase.local', 'Administrador', Role.ADMIN],
    ['usuario@clase.local', 'Usuario de prueba', Role.USER],
  ] as const) {
    await prisma.user.upsert({
      where: { email },
      update: { name, role, tenantId: tenant.id, password },
      create: { email, name, role, tenantId: tenant.id, password },
    });
  }
  console.log('Seed correcto: 1 tenant y 2 usuarios de prueba.');
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
