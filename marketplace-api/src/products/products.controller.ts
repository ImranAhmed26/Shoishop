import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { ProductsService } from './products.service';

@Public()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAllPublic(
    @Query('category') categorySlug?: string,
    @Query('shop') shopSlug?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('sort') sort?: 'newest' | 'price_asc' | 'price_desc',
  ) {
    return this.productsService.findAllPublic({
      categorySlug,
      shopSlug,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      q,
      minPriceCents: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
      maxPriceCents: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined,
      sort,
    });
  }

  @Get(':productId')
  findOnePublic(@Param('productId') productId: string) {
    return this.productsService.findOnePublic(productId);
  }
}
