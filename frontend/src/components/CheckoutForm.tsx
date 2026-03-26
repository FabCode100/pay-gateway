'use client';

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface CheckoutFormProps {
  onSubmit: (data: {
    orderId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
  }) => void;
  isSubmitting: boolean;
}

export default function CheckoutForm({ onSubmit, isSubmitting }: CheckoutFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderId = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;

    onSubmit({
      orderId,
      amount: parseFloat(amount),
      customerName,
      customerEmail,
      paymentMethod,
    });

    // Reset form
    setCustomerName('');
    setCustomerEmail('');
    setAmount('');
    setPaymentMethod('credit_card');
  };

  const isValid = customerName.trim() && customerEmail.trim() && parseFloat(amount) > 0;

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Nome do Paciente / Médico</label>
        <input
          type="text"
          className="form-input"
          placeholder="Dr. João Silva"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">E-mail</label>
        <input
          type="email"
          className="form-input"
          placeholder="joao@sanar.com"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input
            type="number"
            className="form-input"
            placeholder="199.90"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Método</label>
          <select
            className="form-input form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="credit_card">Cartão de Crédito</option>
            <option value="debit_card">Cartão de Débito</option>
            <option value="pix">PIX</option>
            <option value="boleto">Boleto</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="spinner" />
            Processando...
          </>
        ) : (
          <>🔒 Pagar com Segurança</>
        )}
      </button>
    </form>
  );
}
