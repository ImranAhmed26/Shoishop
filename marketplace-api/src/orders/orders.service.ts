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

    const priceByProductId = new Map(products.map((p) => [p.id, p.priceCents]));
    const totalCents = dto.items.reduce(
      (sum, item) => sum + priceByProductId.get(item.productId)! * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
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
            unitPriceCents: priceByProductId.get(item.productId)!,
          })),
        },
      },
      include: { items: { include: { product: true } } },
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
