import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersGateway } from './orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    product: { findMany: jest.Mock; updateMany: jest.Mock };
    order: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let gateway: { emitOrderCreated: jest.Mock; emitOrderUpdated: jest.Mock };

  const product = { id: 'prod-1', title: 'Widget', priceCents: 500, shopId: 'shop-1' };
  const dto: CreateOrderDto = {
    shopId: 'shop-1',
    items: [{ productId: 'prod-1', quantity: 2 }],
    shippingAddress: '123 Main St',
    shippingCity: 'Dhaka',
  } as CreateOrderDto;

  beforeEach(() => {
    prisma = {
      product: { findMany: jest.fn(), updateMany: jest.fn() },
      order: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    gateway = { emitOrderCreated: jest.fn(), emitOrderUpdated: jest.fn() };
    service = new OrdersService(prisma as unknown as PrismaService, gateway as unknown as OrdersGateway);
  });

  it('throws when a requested product is not published in the shop', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.create(dto, null)).rejects.toThrow(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('decrements stock and creates the order when stock is sufficient', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    const createdOrder = { id: 'order-1', shopId: 'shop-1' };
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        order: { create: jest.fn().mockResolvedValue(createdOrder) },
      };
      return fn(tx);
    });

    const result = await service.create(dto, 'buyer-1');

    expect(result).toBe(createdOrder);
    expect(gateway.emitOrderCreated).toHaveBeenCalledWith('shop-1', createdOrder);
  });

  it('throws and rolls back when stock runs out concurrently (updateMany matches 0 rows)', async () => {
    prisma.product.findMany.mockResolvedValue([product]);
    prisma.$transaction.mockImplementation(async (fn) => {
      const tx = {
        product: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
        order: { create: jest.fn() },
      };
      return fn(tx);
    });

    await expect(service.create(dto, 'buyer-1')).rejects.toThrow(BadRequestException);
    expect(gateway.emitOrderCreated).not.toHaveBeenCalled();
  });
});
