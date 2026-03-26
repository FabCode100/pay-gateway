import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sanar-Pay Gateway | Orquestração de Pagamentos',
  description:
    'Simulador de orquestração de pagamentos com idempotência (Redis), processamento assíncrono (RabbitMQ) e status em tempo real (WebSocket).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
