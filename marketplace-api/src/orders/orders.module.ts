import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ShopOwnershipGuard } from '../common/guards/shop-ownership.guard';
import { OrdersController } from './orders.controller';
import { ShopOrdersController } from './shop-orders.controller';
import { BuyerOrdersController } from './buyer-orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [OrdersController, ShopOrdersController, BuyerOrdersController],
  providers: [OrdersService, OrdersGateway, ShopOwnershipGuard],
})
export class OrdersModule {}
