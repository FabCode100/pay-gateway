# 💳 Payment Gateway

![Payment Gateway Hero](file:///C:/Users/fabri/.gemini/antigravity/brain/bc976243-fc17-4a57-b866-3cbff16b7275/payment_gateway_hero_1774547033158.png)

Um simulador de orquestração de pagamentos de alta performance e resiliente, construído com **NestJS**, **Next.js** e uma arquitetura distribuída para processamento de transações seguro e escalável.

---

## 🚀 Funcionalidades Principais

- **✅ Controle de Idempotência**: Bloqueio via Redis para evitar transações duplicadas.
- **⚡ Processamento Assíncrono**: Workers RabbitMQ para execução confiável de tarefas em segundo plano.
- **🕒 Atualizações em Tempo Real**: WebSocket (Socket.io) para rastreamento instantâneo do status do pagamento.
- **🔒 Persistência**: Histórico de transações armazenado no **PostgreSQL**.
- **☁️ Pronto para Nuvem**: Totalmente dockerizado e preparado para **Google Cloud Run**, **Neon** e **Upstash**.

---

## 🏗️ Architecture Design

```mermaid
graph LR
    User([User]) --> Frontend[Next.js Web]
    Frontend --> API[NestJS API]
    API -- "1. Lock (Idempotency)" --> Redis[(Redis)]
    API -- "2. Enqueue" --> Rabbit[RabbitMQ]
    Rabbit -- "3. Process" --> Worker[Payment Worker]
    Worker -- "4. Update Status" --> DB[(PostgreSQL)]
    Worker -- "5. Notify" --> API
    API -- "6. Real-time Status" --> Frontend
```

---

## ☁️ Deployment Guide (Cloud Run)

### 1. Database (PostgreSQL)
A **Neon** project is required for serverless SQL.
- **Host**: `ep-solitary-mountain-amdlhgf7-pooler.c-5.us-east-1.aws.neon.tech`
- **User**: `neondb_owner`

### 2. Environment Variables (.env)

**Backend:**
```env
DB_HOST=...
DB_USER=neondb_owner
DB_PASS=...
DB_NAME=neondb
REDIS_URL=rediss://... # Supports SSL/TLS
RABBITMQ_URL=amqp://...
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://[YOUR-API-URL]/api
NEXT_PUBLIC_WS_URL=https://[YOUR-API-URL]/payments
```

---

## 💻 Local Development

1. **Infrastructure**:
   ```bash
   docker-compose up -d
   ```

2. **Backend**:
   ```bash
   cd backend && npm install && npm run start:dev
   ```

3. **Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```

---

## 📄 License

MIT. Build with ❤️ for modern payment systems.
