import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Pega a porta da variável de ambiente ou usa 3001 como fallback local
  const port = process.env.PORT || 3001;

  app.setGlobalPrefix('api');

  app.enableCors({
    // Em produção, você pode querer adicionar o seu domínio do frontend aqui
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 2. Escuta na porta dinâmica e no host 0.0.0.0 (padrão para containers)
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Sanar-Pay API running on port ${port}`);
}
bootstrap();