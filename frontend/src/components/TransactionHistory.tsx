'use client';

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

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const methodLabels: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  boleto: 'Boleto',
};

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">📋</div>
        <p className="empty-state__text">
          Nenhuma transação registrada ainda
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Método</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {tx.orderId}
                </span>
              </td>
              <td>{tx.customerName}</td>
              <td className="tx-amount">
                R$ {Number(tx.amount).toFixed(2)}
              </td>
              <td>{methodLabels[tx.paymentMethod] || tx.paymentMethod}</td>
              <td>
                <span
                  className={`status-badge status-badge--${tx.status.toLowerCase()}`}
                >
                  {tx.status === 'PAID' && '✓ '}
                  {tx.status === 'FAILED' && '✕ '}
                  {tx.status}
                </span>
              </td>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {new Date(tx.createdAt).toLocaleString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
