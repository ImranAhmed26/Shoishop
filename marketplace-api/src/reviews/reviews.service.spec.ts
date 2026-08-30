import { ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    orderItem: { findFirst: jest.Mock };
    review: { upsert: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      orderItem: { findFirst: jest.fn() },
      review: { upsert: jest.fn() },
    };
    service = new ReviewsService(prisma as unknown as PrismaService);
  });

  it('rejects a review when the buyer has no delivered order for the product', async () => {
    prisma.orderItem.findFirst.mockResolvedValue(null);

    await expect(
      service.createForProduct('prod-1', 'buyer-1', { rating: 5, comment: 'Great!' }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.review.upsert).not.toHaveBeenCalled();
  });

  it('allows and upserts a review when a delivered order item exists', async () => {
    prisma.orderItem.findFirst.mockResolvedValue({ orderId: 'order-1' });
    prisma.review.upsert.mockResolvedValue({ id: 'review-1', rating: 4 });

    const result = await service.createForProduct('prod-1', 'buyer-1', {
      rating: 4,
      comment: 'Good',
    });

    expect(result).toEqual({ id: 'review-1', rating: 4 });
    expect(prisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId_buyerId: { productId: 'prod-1', buyerId: 'buyer-1' } },
        create: expect.objectContaining({ orderId: 'order-1', rating: 4, comment: 'Good' }),
      }),
    );
  });
});
