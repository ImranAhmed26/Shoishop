import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Order } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersGateway } from './orders.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  async create(dto: CreateOrderDto, buyerId: string | null): Promise<Order> {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, shopId: dto.shopId, status: 'PUBLISHED' },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable in this shop');
    }

    const productById = new Map(products.map((p) => [p.id, p]));
    const totalCents = dto.items.reduce(
      (sum, item) => sum + productById.get(item.productId)!.priceCents * item.quantity,
      0,
    );

    // Each decrement is a conditional UPDATE (stockQty >= requested quantity), which Postgres
    // resolves under row-level locking — two concurrent orders for the last unit can't both
    // succeed. matchCount === 0 means either the row disappeared or stock ran out concurrently.
    const order = await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stockQty: { gte: item.quantity } },
          data: {
            stockQty: { decrement: item.quantity },
            orderCount: { increment: 1 },
            soldQty: { increment: item.quantity },
          },
        });
        if (count === 0) {
          const title = productById.get(item.productId)?.title ?? item.productId;
          throw new BadRequestException(`Not enough stock for "${title}"`);
        }
      }

      return tx.order.create({
        data: {
          shopId: dto.shopId,
          buyerId,
          totalCents,
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          guestName: buyerId ? undefined : dto.guestName,
          guestPhone: buyerId ? undefined : dto.guestPhone,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: productById.get(item.productId)!.priceCents,
              totalPriceCents: productById.get(item.productId)!.priceCents * item.quantity,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });
    });

    this.ordersGateway.emitOrderCreated(order.shopId, order);
    return order;
  }

  findForShop(shopId: string) {
    return this.prisma.order.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
  }

  findForBuyer(buyerId: string) {
    return this.prisma.order.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, shop: true },
    });
  }

  async updateStatus(shopId: string, orderId: string, status: Order['status']): Promise<Order> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.shopId !== shopId) {
      throw new NotFoundException('Order not found for this shop');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: { include: { product: true } } },
    });

    this.ordersGateway.emitOrderUpdated(shopId, updated);
    return updated;
  }
}
