import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findForProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: { buyer: { select: { name: true } } },
    });
  }

  async createForProduct(productId: string, buyerId: string, dto: CreateReviewDto) {
    const deliveredOrderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { buyerId, status: 'DELIVERED' },
      },
      orderBy: { id: 'asc' },
    });

    if (!deliveredOrderItem) {
      throw new ForbiddenException('You can only review products from a delivered order');
    }

    return this.prisma.review.upsert({
      where: { productId_buyerId: { productId, buyerId } },
      create: {
        productId,
        buyerId,
        orderId: deliveredOrderItem.orderId,
        rating: dto.rating,
        comment: dto.comment,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }
}
