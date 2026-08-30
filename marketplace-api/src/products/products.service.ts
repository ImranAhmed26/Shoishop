import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  create(shopId: string, dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        shopId,
        title: dto.title,
        description: dto.description,
        priceCents: dto.priceCents,
        stockQty: dto.stockQty ?? 0,
        categoryId: dto.categoryId,
        images: dto.images ?? [],
        status: dto.status ?? 'DRAFT',
      },
    });
  }

  findForShop(shopId: string) {
    return this.prisma.product.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async update(shopId: string, productId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shopId) {
      throw new NotFoundException('Product not found for this shop');
    }

    return this.prisma.product.update({ where: { id: productId }, data: dto });
  }

  async remove(shopId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.shopId !== shopId) {
      throw new NotFoundException('Product not found for this shop');
    }
    await this.prisma.product.delete({ where: { id: productId } });
  }

  private async attachRatings<T extends { id: string }>(
    products: T[],
  ): Promise<(T & { avgRating: number | null; reviewCount: number })[]> {
    if (products.length === 0) return [];
    const stats = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map((p) => p.id) } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const statsByProductId = new Map(stats.map((s) => [s.productId, s]));
    return products.map((product) => {
      const stat = statsByProductId.get(product.id);
      return {
        ...product,
        avgRating: stat?._avg.rating ?? null,
        reviewCount: stat?._count.rating ?? 0,
      };
    });
  }

  async findAllPublic(filters: {
    categorySlug?: string;
    shopSlug?: string;
    page?: number;
    pageSize?: number;
    q?: string;
    minPriceCents?: number;
    maxPriceCents?: number;
    sort?: 'newest' | 'price_asc' | 'price_desc';
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? 24));
    const where = {
      status: 'PUBLISHED' as const,
      shop: { status: 'ACTIVE' as const, slug: filters.shopSlug },
      category: filters.categorySlug ? { slug: filters.categorySlug } : undefined,
      title: filters.q ? { contains: filters.q, mode: 'insensitive' as const } : undefined,
      priceCents:
        filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined
          ? { gte: filters.minPriceCents, lte: filters.maxPriceCents }
          : undefined,
    };

    const orderBy =
      filters.sort === 'price_asc'
        ? { priceCents: 'asc' as const }
        : filters.sort === 'price_desc'
          ? { priceCents: 'desc' as const }
          : { createdAt: 'desc' as const };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        include: { category: true, shop: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: await this.attachRatings(items), total, page, pageSize };
  }

  async findOnePublic(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, shop: true },
    });
    if (!product || product.status !== 'PUBLISHED') {
      throw new NotFoundException('Product not found');
    }
    const [withRating] = await this.attachRatings([product]);
    return withRating;
  }
}
