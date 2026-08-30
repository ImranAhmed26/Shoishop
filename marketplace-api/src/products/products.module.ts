import { Module } from '@nestjs/common';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { BulkImportService } from './bulk-import.service';
import { ProductsController } from './products.controller';
import { ShopProductsController } from './shop-products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, ShopProductsController],
  providers: [ProductsService, ShopOwnershipGuard, BulkImportService],
  exports: [ProductsService],
})
export class ProductsModule {}
