import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../transactions/transaction.entity';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService, PAYMENTS_QUEUE } from '../rabbitmq/rabbitmq.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async processCheckout(dto: CreateCheckoutDto) {
    // 1. Idempotency check via Redis — prevents duplicate charges
    const lockKey = `lock:order:${dto.orderId}`;
    const existingLock = await this.redis.get(lockKey);

    if (existingLock) {
      this.logger.warn(`⚠️ Duplicate payment attempt for order ${dto.orderId}`);
      throw new ConflictException(
        'Pagamento já em processamento para este pedido',
      );
    }

    // 2. Set idempotency lock (5 min TTL)
    await this.redis.set(lockKey, 'processing', 300);

    // 3. Persist transaction as PENDING
    const transaction = this.transactionRepo.create({
      orderId: dto.orderId,
      amount: dto.amount,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      paymentMethod: dto.paymentMethod || 'credit_card',
      status: TransactionStatus.PENDING,
    });
    await this.transactionRepo.save(transaction);

    // 4. Set status in Redis for fast reads
    await this.redis.set(
      `status:order:${dto.orderId}`,
      JSON.stringify({
        orderId: dto.orderId,
        status: TransactionStatus.PENDING,
        amount: dto.amount,
        customerName: dto.customerName,
      }),
    );

    // 5. Publish to RabbitMQ for async processing
    await this.rabbitmq.publish(PAYMENTS_QUEUE, {
      transactionId: transaction.id,
      orderId: dto.orderId,
      amount: dto.amount,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      paymentMethod: dto.paymentMethod || 'credit_card',
    });

    this.logger.log(`✅ Checkout created for order ${dto.orderId}`);

    return {
      message: 'Pagamento recebido e sendo processado',
      orderId: dto.orderId,
      transactionId: transaction.id,
      status: TransactionStatus.PENDING,
    };
  }

  async getOrderStatus(orderId: string) {
    // Fast read from Redis
    const cached = await this.redis.get(`status:order:${orderId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to DB
    const transaction = await this.transactionRepo.findOne({
      where: { orderId },
    });
    if (!transaction) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return {
      orderId: transaction.orderId,
      status: transaction.status,
      amount: transaction.amount,
      customerName: transaction.customerName,
    };
  }

  async getAllTransactions() {
    return this.transactionRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
