import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { BulkImportService } from './bulk-import.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

@UseGuards(ShopOwnershipGuard)
@Controller('shops/:shopId/products')
export class ShopProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly bulkImportService: BulkImportService,
  ) {}

  @Get('bulk-import/template')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="product-import-template.csv"')
  downloadTemplate(): string {
    return this.bulkImportService.buildTemplateCsv();
  }

  @Post('bulk-import')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async bulkImport(
    @Param('shopId') shopId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) && !file.originalname.match(/\.(csv|xlsx)$/i)) {
      throw new BadRequestException('File must be a .csv or .xlsx file');
    }

    const rows = await this.bulkImportService.parseFile(file);
    return this.bulkImportService.importRows(shopId, rows);
  }

  @Get()
  findForShop(@Param('shopId') shopId: string) {
    return this.productsService.findForShop(shopId);
  }

  @Post()
  create(@Param('shopId') shopId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(shopId, dto);
  }

  @Patch(':productId')
  update(
    @Param('shopId') shopId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(shopId, productId, dto);
  }

  @Delete(':productId')
  remove(@Param('shopId') shopId: string, @Param('productId') productId: string) {
    return this.productsService.remove(shopId, productId);
  }
}
