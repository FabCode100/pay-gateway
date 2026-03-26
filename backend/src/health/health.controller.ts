import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitmqService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async checkHealth() {
    const redisOk = await this.redis.ping();
    const rabbitOk = await this.rabbitmq.isHealthy();
    const dbOk = this.dataSource.isInitialized;

    const allHealthy = redisOk && rabbitOk && dbOk;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        postgres: { status: dbOk ? 'up' : 'down' },
        redis: { status: redisOk ? 'up' : 'down' },
        rabbitmq: { status: rabbitOk ? 'up' : 'down' },
      },
    };
  }
}
