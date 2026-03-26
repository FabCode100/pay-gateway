'use client';

import { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  services: {
    postgres: { status: string };
    redis: { status: string };
    rabbitmq: { status: string };
  };
}

export default function HealthBar() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/health');
        if (res.ok) {
          setHealth(await res.json());
        }
      } catch {
        setHealth(null);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { key: 'postgres', label: 'PostgreSQL', icon: '🐘' },
    { key: 'redis', label: 'Redis', icon: '⚡' },
    { key: 'rabbitmq', label: 'RabbitMQ', icon: '🐰' },
  ];

  return (
    <div className="health-bar">
      {services.map((svc) => {
        const isUp =
          health?.services?.[svc.key as keyof typeof health.services]?.status === 'up';
        return (
          <div key={svc.key} className="health-item">
            <span
              className={`health-dot ${isUp ? 'health-dot--up' : 'health-dot--down'}`}
            />
            <span>
              {svc.icon} {svc.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
