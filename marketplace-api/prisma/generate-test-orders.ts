// One-off data generator for local/dev testing — creates a handful of buyer
// accounts and a large batch of orders spread across statuses and dates so
// order history, reviews (which require a DELIVERED order), and admin
// analytics all have something realistic to show. Run with:
//   npx tsx prisma/generate-test-orders.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ORDERS_TO_CREATE = 60;
const STOCK_TOPUP = 50;
const DAYS_BACK = 60;

const BUYERS = [
  { email: 'buyer1@test.com', name: 'Ayesha Rahman' },
  { email: 'buyer2@test.com', name: 'Tanvir Hasan' },
  { email: 'buyer3@test.com', name: 'Nusrat Jahan' },
  { email: 'buyer4@test.com', name: 'Sabbir Ahmed' },
  { email: 'buyer5@test.com', name: 'Farzana Akter' },
];
const BUYER_PASSWORD = process.env.SEED_BUYER_PASSWORD ?? 'TestBuyer123!';

const GUEST_NAMES = ['Rakib Islam', 'Mim Akter', 'Shakil Khan', 'Nadia Sultana'];
const CITIES = ['Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi'];

const STATUS_WEIGHTS: { status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'; weight: number }[] = [
  { status: 'DELIVERED', weight: 40 },
  { status: 'SHIPPED', weight: 20 },
  { status: 'CONFIRMED', weight: 20 },
  { status: 'PLACED', weight: 15 },
  { status: 'CANCELLED', weight: 5 },
];

function pickWeightedStatus() {
  const total = STATUS_WEIGHTS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const entry of STATUS_WEIGHTS) {
    if (roll < entry.weight) return entry.status;
    roll -= entry.weight;
  }
  return STATUS_WEIGHTS[0].status;
}

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  const past = now - Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(past);
}

async function main() {
  const passwordHash = await bcrypt.hash(BUYER_PASSWORD, 10);
  const buyers = await Promise.all(
    BUYERS.map((buyer) =>
      prisma.user.upsert({
        where: { email: buyer.email },
        update: {},
        create: { ...buyer, passwordHash, role: 'BUYER' },
      }),
    ),
  );

  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED', shop: { status: 'ACTIVE' } },
  });
  if (products.length === 0) {
    throw new Error('No published products found — seed some products first.');
  }

  await prisma.product.updateMany({ data: { stockQty: STOCK_TOPUP } });
  const stockById = new Map(products.map((p) => [p.id, STOCK_TOPUP]));

  const productsByShop = new Map<string, typeof products>();
  for (const product of products) {
    const list = productsByShop.get(product.shopId) ?? [];
    list.push(product);
    productsByShop.set(product.shopId, list);
  }
  const shopIds = [...productsByShop.keys()];

  let created = 0;
  for (let i = 0; i < ORDERS_TO_CREATE; i++) {
    const shopId = pickOne(shopIds);
    const shopProducts = productsByShop.get(shopId)!;
    const itemCount = Math.min(shopProducts.length, 1 + Math.floor(Math.random() * 3));
    const chosenProducts = [...shopProducts].sort(() => Math.random() - 0.5).slice(0, itemCount);

    const status = pickWeightedStatus();
    const isGuest = Math.random() > 0.7;
    const buyer = isGuest ? null : pickOne(buyers);
    const createdAt = randomPastDate(DAYS_BACK);

    const items = chosenProducts.map((product) => {
      const quantity = 1 + Math.floor(Math.random() * 3);
      if (status !== 'CANCELLED') {
        const remaining = stockById.get(product.id) ?? 0;
        stockById.set(product.id, Math.max(0, remaining - quantity));
      }
      return { productId: product.id, quantity, unitPriceCents: product.priceCents };
    });
    const totalCents = items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

    await prisma.order.create({
      data: {
        shopId,
        buyerId: buyer?.id ?? null,
        status,
        totalCents,
        shippingAddress: `House ${1 + Math.floor(Math.random() * 200)}, Road ${1 + Math.floor(Math.random() * 30)}`,
        shippingCity: pickOne(CITIES),
        guestName: isGuest ? pickOne(GUEST_NAMES) : undefined,
        guestPhone: isGuest ? `01${700000000 + Math.floor(Math.random() * 99999999)}` : undefined,
        createdAt,
        updatedAt: createdAt,
        items: { create: items },
      },
    });
    created++;
  }

  for (const [productId, remaining] of stockById) {
    await prisma.product.update({ where: { id: productId }, data: { stockQty: remaining } });
  }

  console.log(`Created ${created} test orders across ${shopIds.length} shops.`);
  console.log(`Buyer login for testing: any of ${BUYERS.map((b) => b.email).join(', ')} / password "${BUYER_PASSWORD}"`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
