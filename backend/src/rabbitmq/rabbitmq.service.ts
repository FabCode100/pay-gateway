import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { connect, ChannelModel, Channel, ConsumeMessage } from 'amqplib';

export const PAYMENTS_QUEUE = 'payments_queue';
export const PAYMENTS_DLQ = 'payments_dlq';
const PAYMENTS_DLX = 'payments_dlx';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private connection: ChannelModel;
  private publishChannel: Channel;
  private consumeChannel: Channel;
  private readonly logger = new Logger(RabbitmqService.name);
  private isConnecting = false;
  private connectionInitialPromise: Promise<void>;
  private resolveConnection: () => void;

  constructor() {
    this.connectionInitialPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    const url =
      process.env.RABBITMQ_URL || 'amqp://sanar:sanar123@localhost:5672';
    
    let retries = 0;
    const maxRetries = 10;

    while (retries < maxRetries) {
      try {
        this.logger.log(`🔄 Connecting to RabbitMQ at ${url.replace(/:.*@/, ':****@')}...`);
        this.connection = await connect(url);

        // Connection event listeners
        this.connection.on('error', (err) => {
          this.logger.error('❌ RabbitMQ connection error', err);
          this.handleDisconnect();
        });

        this.connection.on('close', () => {
          this.logger.warn('⚠️ RabbitMQ connection closed');
          this.handleDisconnect();
        });

        // Separate channels for publish/consume
        this.publishChannel = await this.connection.createChannel();
        this.consumeChannel = await this.connection.createChannel();

        this.publishChannel.on('error', (err) => this.logger.error('❌ Publish channel error', err));
        this.consumeChannel.on('error', (err) => this.logger.error('❌ Consume channel error', err));

        await this.setupQueues();

        this.logger.log('✅ RabbitMQ connected — channels ready');
        this.isConnecting = false;
        this.resolveConnection();
        return;
      } catch (err) {
        retries++;
        this.logger.warn(
          `RabbitMQ connection attempt ${retries}/${maxRetries} failed: ${err.message}. Retrying in 3s...`,
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    this.isConnecting = false;
    this.logger.error('🛑 Failed to connect to RabbitMQ after max retries');
  }

  private async handleDisconnect() {
    if (this.isConnecting) return;
    
    this.logger.log('🔄 Attempting to reconnect to RabbitMQ...');
    
    // Reset the internal promise so future calls wait for the new connection
    this.connectionInitialPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;
    });

    await this.connect();
  }

  private async setupQueues() {
    // Dead Letter Exchange & Queue
    await this.publishChannel.assertExchange(PAYMENTS_DLX, 'direct', { durable: true });
    await this.publishChannel.assertQueue(PAYMENTS_DLQ, { durable: true });
    await this.publishChannel.bindQueue(PAYMENTS_DLQ, PAYMENTS_DLX, PAYMENTS_QUEUE);

    // Main payments queue with DLQ config
    await this.publishChannel.assertQueue(PAYMENTS_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': PAYMENTS_DLX,
        'x-dead-letter-routing-key': PAYMENTS_QUEUE,
      },
    });

    // Prefetch for consumer
    await this.consumeChannel.prefetch(1);
  }

  private async waitReady() {
    await this.connectionInitialPromise;
    if (!this.publishChannel || !this.consumeChannel) {
      throw new Error('RabbitMQ channels are not initialized');
    }
  }

  async publish(queue: string, data: any): Promise<void> {
    await this.waitReady();
    this.publishChannel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(data)),
      { persistent: true },
    );
    this.logger.log(`📤 Published to ${queue}: ${data.orderId || 'message'}`);
  }

  async consume(
    queue: string,
    handler: (msg: ConsumeMessage) => Promise<void>,
  ): Promise<void> {
    await this.waitReady();
    await this.consumeChannel.consume(queue, async (msg) => {
      if (msg) {
        try {
          await handler(msg);
        } catch (err) {
          this.logger.error(`Error in consumer handler for queue ${queue}`, err);
        }
      }
    });
    this.logger.log(`👂 Consuming from ${queue}`);
  }

  ack(msg: ConsumeMessage) {
    if (this.consumeChannel) {
      this.consumeChannel.ack(msg);
    }
  }

  nack(msg: ConsumeMessage, requeue = false) {
    if (this.consumeChannel) {
      this.consumeChannel.nack(msg, false, requeue);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      return !!(this.connection && this.publishChannel && this.consumeChannel);
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Closing RabbitMQ connection...');
    try {
      await this.publishChannel?.close();
      await this.consumeChannel?.close();
      await this.connection?.close();
    } catch (err) {
      this.logger.error('Error closing RabbitMQ connection', err);
    }
  }
}
