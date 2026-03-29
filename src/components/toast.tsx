'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

let _nextId = 0;
let _addToast: ((text: string, type: 'success' | 'error') => void) | null = null;

/** Fire a toast from anywhere (call after mount) */
export function showToast(text: string, type: 'success' | 'error' = 'success') {
  _addToast?.(text, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const add = useCallback((text: string, type: 'success' | 'error') => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  useEffect(() => {
    _addToast = add;
    return () => { _addToast = null; };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            background: t.type === 'success' ? '#22c55e' : '#ef4444',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'toast-in 0.3s ease',
            pointerEvents: 'auto',
          }}
        >
          {t.type === 'success' ? '✓' : '✕'} {t.text}
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
