import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HomepageLinkType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomepageLinkDto } from './dto/create-homepage-link.dto';
import { UpdateHeroDto } from './dto/update-hero.dto';

const SETTINGS_ID = 'singleton';

@Injectable()
export class HomepageConfigService {
  constructor(private readonly prisma: PrismaService) {}

  private async getLinksWithLabels() {
    const links = await this.prisma.homepageLink.findMany({
      orderBy: { order: 'asc' },
      include: { category: true, brand: true },
    });
    return links.map((link) => {
      const target = link.type === HomepageLinkType.CATEGORY ? link.category : link.brand;
      return {
        id: link.id,
        type: link.type,
        label: target?.name ?? '(deleted)',
        slug: target?.slug ?? null,
      };
    });
  }

  async getPublicConfig() {
    const settings = await this.prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
    return {
      heroImageUrl: settings?.heroImageUrl ?? null,
      links: await this.getLinksWithLabels(),
    };
  }

  async getAdminConfig() {
    const settings = await this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });
    return {
      heroImageUrl: settings.heroImageUrl,
      links: await this.getLinksWithLabels(),
    };
  }

  async updateHero(dto: UpdateHeroDto) {
    await this.prisma.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, heroImageUrl: dto.heroImageUrl },
      update: { heroImageUrl: dto.heroImageUrl },
    });
    return this.getAdminConfig();
  }

  async addLink(dto: CreateHomepageLinkDto) {
    if (dto.type === HomepageLinkType.CATEGORY && !dto.categoryId) {
      throw new BadRequestException('categoryId is required for a category link');
    }
    if (dto.type === HomepageLinkType.BRAND && !dto.brandId) {
      throw new BadRequestException('brandId is required for a brand link');
    }

    const maxOrder = await this.prisma.homepageLink.aggregate({ _max: { order: true } });
    await this.prisma.homepageLink.create({
      data: {
        type: dto.type,
        categoryId: dto.type === HomepageLinkType.CATEGORY ? dto.categoryId : undefined,
        brandId: dto.type === HomepageLinkType.BRAND ? dto.brandId : undefined,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
    return this.getAdminConfig();
  }

  async removeLink(id: string) {
    const link = await this.prisma.homepageLink.findUnique({ where: { id } });
    if (!link) {
      throw new NotFoundException('Homepage link not found');
    }
    await this.prisma.homepageLink.delete({ where: { id } });
    return this.getAdminConfig();
  }

  async moveLink(id: string, direction: 'up' | 'down') {
    const links = await this.prisma.homepageLink.findMany({ orderBy: { order: 'asc' } });
    const index = links.findIndex((link) => link.id === id);
    if (index === -1) {
      throw new NotFoundException('Homepage link not found');
    }
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= links.length) {
      return this.getAdminConfig();
    }

    const current = links[index];
    const swapWith = links[swapIndex];
    await this.prisma.$transaction([
      this.prisma.homepageLink.update({ where: { id: current.id }, data: { order: swapWith.order } }),
      this.prisma.homepageLink.update({ where: { id: swapWith.id }, data: { order: current.order } }),
    ]);
    return this.getAdminConfig();
  }
}
