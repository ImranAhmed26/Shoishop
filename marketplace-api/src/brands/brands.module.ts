import { Module } from '@nestjs/common';
import { BrandsAdminController } from './brands-admin.controller';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  controllers: [BrandsController, BrandsAdminController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
