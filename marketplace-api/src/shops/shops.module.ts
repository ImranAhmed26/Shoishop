import { Module } from '@nestjs/common';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { ShopsController } from './shops.controller';
import { ShopsService } from './shops.service';

@Module({
  controllers: [ShopsController],
  providers: [ShopsService, ShopOwnershipGuard],
  exports: [ShopsService],
})
export class ShopsModule {}
