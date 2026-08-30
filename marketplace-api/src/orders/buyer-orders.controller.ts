import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { OrdersService } from './orders.service';

@Controller('orders/mine')
export class BuyerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findForBuyer(user.id);
  }
}
