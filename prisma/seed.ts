import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create test users
  const adminPassword = await hashPassword('admin123456');
  const userPassword = await hashPassword('user123456');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@leadfinder.app' },
    update: {},
    create: {
      email: 'admin@leadfinder.app',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@leadfinder.app' },
    update: {},
    create: {
      email: 'user@leadfinder.app',
      name: 'Test User',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log({ admin, user });
  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
