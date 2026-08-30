import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guards any route nested under /shops/:shopId/**.
 * ADMIN bypasses ownership entirely; everyone else must own the shop.
 * Attaches the resolved shop to `req.shop` so handlers don't re-fetch it.
 */
@Injectable()
export class ShopOwnershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const shopId = req.params.shopId;

    const shop = await this.prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    const user = req.user;
    if (user?.role !== 'ADMIN' && shop.ownerId !== user?.id) {
      throw new ForbiddenException('You do not have access to this shop');
    }

    req.shop = shop;
    return true;
  }
}
