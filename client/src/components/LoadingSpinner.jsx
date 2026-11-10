// src/components/LoadingSpinner.jsx
// ---------------------------------------------------------
// A centred animated spinner shown during async operations.
// size prop: 'sm' | 'md' | 'lg'
// fullPage prop: wraps in a full-viewport overlay
// ---------------------------------------------------------

export default function LoadingSpinner({ size = 'md', fullPage = false, message = '' }) {
  const sizes = { sm: 20, md: 36, lg: 56 };
  const px = sizes[size] || 36;

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: 'spin 0.9s linear infinite' }}
        aria-label="Loading"
        role="status"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      {message && <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{message}</p>}

      {/* Keyframe injected via style tag — avoids needing a CSS file for this component */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.85)', zIndex: 9999,
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

