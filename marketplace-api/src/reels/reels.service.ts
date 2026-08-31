import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Reel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';

const FEED_PAGE_SIZE = 10;

@Injectable()
export class ReelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(shopId: string, dto: CreateReelDto): Promise<Reel> {
    return this.prisma.reel.create({
      data: {
        shopId,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        caption: dto.caption,
        linkedProductId: dto.linkedProductId,
      },
    });
  }

  findForShop(shopId: string) {
    return this.prisma.reel.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: { linkedProduct: true },
    });
  }

  async update(shopId: string, reelId: string, dto: UpdateReelDto): Promise<Reel> {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel || reel.shopId !== shopId) {
      throw new NotFoundException('Reel not found for this shop');
    }

    const data: Prisma.ReelUpdateInput = {
      caption: dto.caption,
      thumbnailUrl: dto.thumbnailUrl,
      status: dto.status,
    };
    if (dto.linkedProductId !== undefined) {
      data.linkedProduct = dto.linkedProductId
        ? { connect: { id: dto.linkedProductId } }
        : { disconnect: true };
    }

    return this.prisma.reel.update({ where: { id: reelId }, data });
  }

  async remove(shopId: string, reelId: string): Promise<void> {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } });
    if (!reel || reel.shopId !== shopId) {
      throw new NotFoundException('Reel not found for this shop');
    }
    await this.prisma.reel.delete({ where: { id: reelId } });
  }

  async feed(cursor?: string) {
    const reels = await this.prisma.reel.findMany({
      where: { status: 'PUBLISHED', shop: { status: 'ACTIVE' } },
      orderBy: { createdAt: 'desc' },
      take: FEED_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { shop: true, linkedProduct: true },
    });

    const hasMore = reels.length > FEED_PAGE_SIZE;
    const items = hasMore ? reels.slice(0, FEED_PAGE_SIZE) : reels;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async incrementView(reelId: string): Promise<void> {
    try {
      await this.prisma.reel.update({
        where: { id: reelId },
        data: { viewCount: { increment: 1 } },
      });
    } catch {
      throw new NotFoundException('Reel not found');
    }
  }
}
