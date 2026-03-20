// src/components/notifications/StockAlertToast.tsx
import { useEffect, useState } from 'react';
import { useSocketEvent } from '../../hooks/useSocket';

interface StockAlert {
  id: number;
  numero: string;
  nom: string;
  quantite: number;
}

interface ToastItem extends StockAlert {
  toastId: number;
}

interface StockAlertToastProps {
  token: string | null;
}

/**
 * Composant à placer une seule fois dans le Layout.
 * Il écoute l'événement "stock-alert" et affiche un toast pour chaque alerte.
 */
export function StockAlertToast({ token }: StockAlertToastProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useSocketEvent<StockAlert>(token, 'stock-alert', (data) => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { ...data, toastId }]);

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 5000);
  });

  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.toastId} style={styles.toast}>
          <span style={styles.icon}>⚠️</span>
          <div style={styles.content}>
            <strong>Stock épuisé</strong>
            <p style={styles.message}>
              {toast.nom} ({toast.numero}) — Quantité : {toast.quantite}
            </p>
          </div>
          <button
            style={styles.close}
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))
            }
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '360px',
  },
  toast: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    background: '#1e1e2e',
    border: '1px solid #f97316',
    borderLeft: '4px solid #f97316',
    borderRadius: '8px',
    padding: '0.875rem 1rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
    color: '#f1f5f9',
    animation: 'slideIn 0.25s ease',
  },
  icon: { fontSize: '1.25rem', flexShrink: 0 },
  content: { flex: 1 },
  message: { margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#cbd5e1' },
  close: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: 0,
    lineHeight: 1,
    flexShrink: 0,
  },
};