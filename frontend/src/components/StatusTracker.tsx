'use client';

interface OrderStatus {
  orderId: string;
  status: string;
  amount?: number;
  customerName?: string;
  failureReason?: string;
}

interface StatusTrackerProps {
  order: OrderStatus | null;
}

const STEPS = [
  {
    key: 'PENDING',
    label: 'Pedido Recebido',
    desc: 'Verificação de idempotência no Redis',
    icon: '📝',
  },
  {
    key: 'PROCESSING',
    label: 'Processando Pagamento',
    desc: 'Worker consumindo mensagem do RabbitMQ',
    icon: '⚙️',
  },
  {
    key: 'PAID',
    label: 'Pagamento Confirmado',
    desc: 'Atualizado no Redis e PostgreSQL',
    icon: '✅',
  },
];

function getStepState(
  stepKey: string,
  currentStatus: string,
): 'waiting' | 'active' | 'completed' | 'failed' {
  const order = ['PENDING', 'PROCESSING', 'PAID'];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepKey);

  if (currentStatus === 'FAILED') {
    if (stepIdx < order.indexOf('PAID')) {
      // Steps before failure are completed up to the failed point
      if (stepIdx <= 1) return 'completed';
    }
    if (stepKey === 'PAID') return 'failed';
    return 'completed';
  }

  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'waiting';
}

export default function StatusTracker({ order }: StatusTrackerProps) {
  if (!order) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📡</div>
        <p className="empty-state__text">
          Envie um pagamento para acompanhar o status em tempo real via WebSocket
        </p>
      </div>
    );
  }

  return (
    <div className="status-tracker">
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginRight: '0.5rem',
          }}
        >
          Pedido:
        </span>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--accent-light)',
            fontFamily: 'monospace',
          }}
        >
          {order.orderId}
        </span>
        {order.amount && (
          <span
            style={{
              marginLeft: '1rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            R$ {Number(order.amount).toFixed(2)}
          </span>
        )}
      </div>

      <div className="status-steps">
        {STEPS.map((step) => {
          const state = getStepState(step.key, order.status);
          return (
            <div key={step.key} className={`status-step status-step--${state}`}>
              <div className="status-step__indicator">{step.icon}</div>
              <div className="status-step__line" />
              <div className="status-step__content">
                <div className="status-step__title">{step.label}</div>
                <div className="status-step__desc">
                  {step.key === 'PAID' && order.status === 'FAILED'
                    ? order.failureReason || 'Falha no gateway de pagamento'
                    : step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
