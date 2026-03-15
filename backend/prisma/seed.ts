import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const existingOwner = await prisma.user.findUnique({
    where: { email: 'owner@fitflow.com' },
  });

  if (existingOwner) {
    console.log('Owner already exists, skipping seed');
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 10);

  const owner = await prisma.user.create({
    data: {
      email: 'owner@fitflow.com',
      passwordHash,
      username: 'Gym Owner',
      role: 'OWNER',
      isActive: true,
    },
  });

  console.log(`Owner created: ${owner.email} (password: admin123)`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
