# 💳 Payment Gateway

Simulador de orquestração de pagamentos com **idempotência via Redis**, **processamento assíncrono via RabbitMQ**, status em tempo-real via **WebSocket**, e persistência em **PostgreSQL**.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS, TypeORM, PostgreSQL |
| Mensageria | RabbitMQ (com DLQ) |
| Cache/Idempotência | Redis |
| Frontend | Next.js, React, TypeScript |
| Infra | Docker Compose |

## Arquitetura

```
[Frontend] → POST /checkout → [NestJS API]
                                   ├─ Redis (idempotency lock)
                                   └─ RabbitMQ (publish)
                                        │
                                   [Payment Worker]
                                   ├─ Simula gateway (Stripe/Stone)
                                   ├─ Redis (status update)
                                   └─ PostgreSQL (persist)
                                        │
                               WebSocket ← [Frontend real-time status]
```

## Rodando

```bash
# 1. Infraestrutura
docker-compose up -d

# 2. Backend
cd backend && npm install && npm run start:dev

# 3. Frontend
cd frontend && npm install && npm run dev
```

- **App**: http://localhost:3000
- **API**: http://localhost:3001/api
- **RabbitMQ**: http://localhost:15672 (sanar/sanar123)
