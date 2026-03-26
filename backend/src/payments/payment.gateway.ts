import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/payments',
})
export class PaymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PaymentGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:order')
  handleSubscribe(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
    this.logger.log(`👁️ Client ${client.id} subscribed to order ${orderId}`);
  }

  emitPaymentStatus(orderId: string, data: any) {
    this.server.to(`order:${orderId}`).emit('payment:status', data);
    // Also broadcast to all for the dashboard
    this.server.emit('payment:update', data);
    this.logger.log(`📡 Emitted status ${data.status} for order ${orderId}`);
  }
}
