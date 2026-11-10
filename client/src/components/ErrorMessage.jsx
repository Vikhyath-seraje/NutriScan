// src/components/ErrorMessage.jsx
// ---------------------------------------------------------
// Displays inline error/warning/success/info banners.
// type: 'error' | 'warning' | 'success' | 'info'
// onClose: optional callback to dismiss the message
// ---------------------------------------------------------

const typeConfig = {
  error:   { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', icon: '⚠️' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', icon: '⚡' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', icon: '✅' },
  info:    { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' },
};

export default function ErrorMessage({ message, type = 'error', onClose }) {
  if (!message) return null;

  const cfg = typeConfig[type] || typeConfig.error;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-md)',
        color: cfg.text,
        fontSize: '0.875rem',
        lineHeight: '1.5',
        marginBottom: '16px',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: cfg.text,
            padding: '0 2px',
            fontSize: '1rem',
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

