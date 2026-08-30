import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Brand } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto): Promise<Brand> {
    const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('A brand with this slug already exists');
    }
    return this.prisma.brand.create({ data: { name: dto.name, slug: dto.slug } });
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (dto.slug && dto.slug !== brand.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException('A brand with this slug already exists');
      }
    }
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.prisma.brand.delete({ where: { id } });
  }

  async findAll() {
    const brands = await this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: { where: { status: 'PUBLISHED' } } } } },
    });
    return brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      productCount: brand._count.products,
    }));
  }

  async findBySlug(slug: string) {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }
}
