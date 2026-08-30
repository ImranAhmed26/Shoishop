import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth/auth.service';

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((pair) => {
      const [key, ...rest] = pair.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    }),
  );
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrdersGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const cookies = parseCookies(client.handshake.headers.cookie);
      const token = cookies.accessToken;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      if (payload.role === 'ADMIN') {
        client.join('admin');
      }

      if (payload.role === 'SHOP_OWNER' || payload.role === 'ADMIN') {
        const shops = await this.prisma.shop.findMany({
          where: { ownerId: payload.sub },
          select: { id: true },
        });
        shops.forEach((shop) => client.join(`shop:${shop.id}`));
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  emitOrderCreated(shopId: string, order: unknown) {
    this.server.to(`shop:${shopId}`).emit('order.created', order);
    this.server.to('admin').emit('order.created', order);
  }

  emitOrderUpdated(shopId: string, order: unknown) {
    this.server.to(`shop:${shopId}`).emit('order.updated', order);
    this.server.to('admin').emit('order.updated', order);
  }
}
