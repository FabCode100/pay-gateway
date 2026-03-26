'use client';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning';
}

export default function Toast({ message, type }: ToastProps) {
  return <div className={`toast toast--${type}`}>{message}</div>;
}
