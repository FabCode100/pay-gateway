import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/transaction.entity';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService, PAYMENTS_QUEUE } from '../rabbitmq/rabbitmq.service';
import { PaymentGateway } from './payment.gateway';

const MAX_RETRIES = 3;

@Injectable()
export class PaymentWorker implements OnModuleInit {
  private readonly logger = new Logger(PaymentWorker.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    private readonly wsGateway: PaymentGateway,
  ) {}

  async onModuleInit() {
    this.logger.log('🔄 Payment Worker started — listening for messages...');
    await this.startConsuming();
  }

  private async startConsuming() {
    await this.rabbitmq.consume(PAYMENTS_QUEUE, async (msg) => {
      const order = JSON.parse(msg.content.toString());
      const retryCount = (msg.properties.headers?.['x-retry-count'] as number) || 0;

      this.logger.log(
        `💰 Processing payment for order ${order.orderId} (attempt ${retryCount + 1}/${MAX_RETRIES})`,
      );

      try {
        // Update status to PROCESSING
        await this.updateStatus(order.orderId, order.transactionId, TransactionStatus.PROCESSING, order);

        // Simulate payment gateway call (1-3s delay)
        await this.simulatePaymentGateway(order);

        // Payment successful
        await this.updateStatus(order.orderId, order.transactionId, TransactionStatus.PAID, order);

        this.rabbitmq.ack(msg);
        this.logger.log(`✅ Payment SUCCESS for order ${order.orderId}`);
      } catch (error) {
        this.logger.error(
          `❌ Payment FAILED for order ${order.orderId}: ${error.message}`,
        );

        if (retryCount < MAX_RETRIES - 1) {
          // Retry: nack and requeue
          this.logger.warn(
            `🔁 Retrying order ${order.orderId} (${retryCount + 1}/${MAX_RETRIES})`,
          );
          this.rabbitmq.nack(msg, true);
        } else {
          // Max retries exhausted — send to DLQ
          this.logger.error(
            `☠️ Order ${order.orderId} sent to Dead Letter Queue after ${MAX_RETRIES} attempts`,
          );
          await this.updateStatus(
            order.orderId,
            order.transactionId,
            TransactionStatus.FAILED,
            order,
            error.message,
          );
          this.rabbitmq.nack(msg, false); // goes to DLQ
        }
      }
    });
  }

  private async simulatePaymentGateway(order: any): Promise<void> {
    // Simulate network latency (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    await new Promise((r) => setTimeout(r, delay));

    // ~80% success rate to demonstrate resilience
    if (Math.random() < 0.2) {
      throw new Error('Gateway timeout — acquirer unavailable');
    }
  }

  private async updateStatus(
    orderId: string,
    transactionId: string,
    status: TransactionStatus,
    order: any,
    failureReason?: string,
  ) {
    // Update DB
    await this.transactionRepo.update(
      { orderId },
      { status, ...(failureReason && { failureReason }) },
    );

    // Update Redis for fast frontend reads
    const statusData = JSON.stringify({
      orderId,
      status,
      amount: order.amount,
      customerName: order.customerName,
      ...(failureReason && { failureReason }),
    });
    await this.redis.set(`status:order:${orderId}`, statusData);

    // Notify frontend via WebSocket
    this.wsGateway.emitPaymentStatus(orderId, {
      orderId,
      status,
      amount: order.amount,
      customerName: order.customerName,
      ...(failureReason && { failureReason }),
    });
  }
}
