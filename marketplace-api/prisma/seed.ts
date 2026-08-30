import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Clothes', slug: 'clothes' },
  { name: 'Baby Products', slug: 'baby-products' },
  { name: 'Gadgets', slug: 'gadgets' },
  { name: 'Viral & Novelty', slug: 'viral-novelty' },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@marketplace.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Platform Admin',
      role: 'ADMIN',
    },
  });

  console.log(`Seeded ${CATEGORIES.length} categories and admin user (${adminEmail}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
