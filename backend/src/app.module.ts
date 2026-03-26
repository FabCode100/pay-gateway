import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { Transaction } from './transactions/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'sanar',
      password: process.env.DB_PASS || 'sanar123',
      database: process.env.DB_NAME || 'sanar_pay',
      entities: [Transaction],
      synchronize: true, // dev only
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    RedisModule,
    RabbitmqModule,
    CheckoutModule,
    PaymentsModule,
    HealthModule,
  ],
})
export class AppModule { }
