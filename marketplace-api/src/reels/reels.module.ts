import { Module } from '@nestjs/common';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { ReelsController } from './reels.controller';
import { ShopReelsController } from './shop-reels.controller';
import { ReelsService } from './reels.service';

@Module({
  controllers: [ReelsController, ShopReelsController],
  providers: [ReelsService, ShopOwnershipGuard],
})
export class ReelsModule {}
