import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentWorker } from './payment.worker';
import { PaymentGateway } from './payment.gateway';
import { Transaction } from '../transactions/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [PaymentWorker, PaymentGateway],
  exports: [PaymentGateway],
})
export class PaymentsModule {}
