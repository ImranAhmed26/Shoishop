import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Shop } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShopDto, actingUser: AuthenticatedUser): Promise<Shop> {
    const existing = await this.prisma.shop.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('A shop with this slug already exists');
    }

    const ownerId = actingUser.role === 'ADMIN' && dto.ownerId ? dto.ownerId : actingUser.id;

    return this.prisma.shop.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        bannerUrl: dto.bannerUrl,
        ownerId,
      },
    });
  }

  findAllForAdmin() {
    return this.prisma.shop.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findMine(ownerId: string) {
    return this.prisma.shop.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } });
  }

  findAllPublic() {
    return this.prisma.shop.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string): Promise<Shop> {
    const shop = await this.prisma.shop.findUnique({ where: { slug } });
    if (!shop || shop.status !== 'ACTIVE') {
      throw new NotFoundException('Shop not found');
    }
    return shop;
  }

  async update(shopId: string, dto: UpdateShopDto, actingUser: AuthenticatedUser): Promise<Shop> {
    if (dto.status && actingUser.role !== 'ADMIN') {
      throw new ForbiddenException('Only an admin can change shop status');
    }

    return this.prisma.shop.update({ where: { id: shopId }, data: dto });
  }
}
