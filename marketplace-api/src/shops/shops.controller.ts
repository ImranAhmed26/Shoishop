import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Public()
  @Get()
  findAllPublic() {
    return this.shopsService.findAllPublic();
  }

  @Public()
  @Get('by-slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.shopsService.findBySlug(slug);
  }

  @Roles('ADMIN')
  @Get('admin/all')
  findAllForAdmin() {
    return this.shopsService.findAllForAdmin();
  }

  @Roles('SHOP_OWNER', 'ADMIN')
  @Get('mine')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.shopsService.findMine(user.id);
  }

  @Roles('SHOP_OWNER', 'ADMIN')
  @Post()
  create(@Body() dto: CreateShopDto, @CurrentUser() user: AuthenticatedUser) {
    return this.shopsService.create(dto, user);
  }

  @UseGuards(ShopOwnershipGuard)
  @Patch(':shopId')
  update(
    @Param('shopId') shopId: string,
    @Body() dto: UpdateShopDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.shopsService.update(shopId, dto, user);
  }
}
