import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@UseGuards(ShopOwnershipGuard)
@Controller('shops/:shopId/orders')
export class ShopOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findForShop(@Param('shopId') shopId: string) {
    return this.ordersService.findForShop(shopId);
  }

  @Patch(':orderId/status')
  updateStatus(
    @Param('shopId') shopId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(shopId, orderId, dto.status);
  }
}
