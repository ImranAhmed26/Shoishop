import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { CreateReelDto } from './dto/create-reel.dto';
import { UpdateReelDto } from './dto/update-reel.dto';
import { ReelsService } from './reels.service';

@UseGuards(ShopOwnershipGuard)
@Controller('shops/:shopId/reels')
export class ShopReelsController {
  constructor(private readonly reelsService: ReelsService) {}

  @Get()
  findForShop(@Param('shopId') shopId: string) {
    return this.reelsService.findForShop(shopId);
  }

  @Post()
  create(@Param('shopId') shopId: string, @Body() dto: CreateReelDto) {
    return this.reelsService.create(shopId, dto);
  }

  @Patch(':reelId')
  update(
    @Param('shopId') shopId: string,
    @Param('reelId') reelId: string,
    @Body() dto: UpdateReelDto,
  ) {
    return this.reelsService.update(shopId, reelId, dto);
  }

  @Delete(':reelId')
  remove(@Param('shopId') shopId: string, @Param('reelId') reelId: string) {
    return this.reelsService.remove(shopId, reelId);
  }
}
