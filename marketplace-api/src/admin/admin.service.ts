import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics() {
    const [shopCount, orderCount, revenue, ordersByStatus, topProductRows] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { totalCents: true },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const topProducts = await this.prisma.product.findMany({
      where: { id: { in: topProductRows.map((row) => row.productId) } },
      select: { id: true, title: true },
    });
    const titleById = new Map(topProducts.map((p) => [p.id, p.title]));

    return {
      shopCount,
      orderCount,
      totalRevenueCents: revenue._sum.totalCents ?? 0,
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.status,
        count: row._count.status,
      })),
      topProducts: topProductRows.map((row) => ({
        productId: row.productId,
        title: titleById.get(row.productId) ?? row.productId,
        unitsSold: row._sum.quantity ?? 0,
      })),
    };
  }
}
