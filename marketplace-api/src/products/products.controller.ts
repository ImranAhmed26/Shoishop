import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ProductsService } from './products.service';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAllPublic(@Query('category') categorySlug?: string, @Query('shop') shopSlug?: string) {
    return this.productsService.findAllPublic({ categorySlug, shopSlug });
  }

  @Get(':productId')
  findOnePublic(@Param('productId') productId: string) {
    return this.productsService.findOnePublic(productId);
  }
}
