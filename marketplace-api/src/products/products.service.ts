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

  findAllPublic(filters: { categorySlug?: string; shopSlug?: string }) {
    return this.prisma.product.findMany({
      where: {
        status: 'PUBLISHED',
        shop: { status: 'ACTIVE', slug: filters.shopSlug },
        category: filters.categorySlug ? { slug: filters.categorySlug } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: { category: true, shop: true },
    });
  }

  async findOnePublic(productId: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, shop: true },
    });
    if (!product || product.status !== 'PUBLISHED') {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
