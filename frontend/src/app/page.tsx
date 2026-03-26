'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import CheckoutForm from '@/components/CheckoutForm';
import StatusTracker from '@/components/StatusTracker';
import TransactionHistory from '@/components/TransactionHistory';
import HealthBar from '@/components/HealthBar';
import Toast from '@/components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001/payments';

interface OrderStatus {
  orderId: string;
  status: string;
  amount?: number;
  customerName?: string;
  failureReason?: string;
}

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  createdAt: string;
}

interface ToastData {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function HomePage() {
  const [currentOrder, setCurrentOrder] = useState<OrderStatus | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // WebSocket connection
  useEffect(() => {
    const ws = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    ws.on('connect', () => {
      console.log('🔌 WebSocket connected');
    });

    ws.on('payment:update', (data: OrderStatus) => {
      // Update current tracked order
      setCurrentOrder((prev) => {
        if (prev && prev.orderId === data.orderId) {
          return data;
        }
        return prev;
      });

      // Update transaction in list
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.orderId === data.orderId ? { ...tx, status: data.status } : tx,
        ),
      );

      // Show toast on final status
      if (data.status === 'PAID') {
        showToast(`✅ Pagamento ${data.orderId} confirmado!`, 'success');
      } else if (data.status === 'FAILED') {
        showToast(`❌ Pagamento ${data.orderId} falhou`, 'error');
      }
    });

    setSocket(ws);
    return () => {
      ws.disconnect();
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`${API_URL}/checkout/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const showToast = (message: string, type: ToastData['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCheckout = async (formData: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.status === 202) {
        setCurrentOrder({
          orderId: formData.orderId,
          status: 'PENDING',
          amount: formData.amount,
          customerName: formData.customerName,
        });

        // Subscribe to order updates via WebSocket
        socket?.emit('subscribe:order', formData.orderId);

        showToast('💳 Pagamento enviado para processamento!', 'success');
        fetchTransactions();
      } else if (res.status === 409) {
        showToast('⚠️ Este pedido já está em processamento', 'warning');
      } else {
        showToast(`Erro: ${data.message}`, 'error');
      }
    } catch (err) {
      showToast('Erro de conexão com o servidor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <header className="header">
          <div className="header__badge">⚡ Real-time Payment Orchestration</div>
          <h1 className="header__title">Sanar-Pay Gateway</h1>
          <p className="header__subtitle">
            Redis • RabbitMQ • WebSocket — Processamento resiliente de pagamentos
          </p>
        </header>

        <HealthBar />

        <div className="dashboard-grid">
          {/* Checkout Form */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon card__icon--accent">💳</div>
              <h2 className="card__title">Novo Pagamento</h2>
            </div>
            <CheckoutForm
              onSubmit={handleCheckout}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Status Tracker */}
          <div className="card">
            <div className="card__header">
              <div className="card__icon card__icon--success">📡</div>
              <h2 className="card__title">Status em Tempo Real</h2>
            </div>
            <StatusTracker order={currentOrder} />
          </div>
        </div>

        {/* Transaction History */}
        <div className="transactions-section">
          <div className="card">
            <div className="card__header">
              <div className="card__icon card__icon--accent">📋</div>
              <h2 className="card__title">Histórico de Transações</h2>
            </div>
            <TransactionHistory transactions={transactions} />
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
