// src/pages/NotFound.jsx
// ---------------------------------------------------------
// 404 page shown when a route doesn't match.
// ---------------------------------------------------------

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 20px',
      background: 'var(--color-bg)',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '16px' }}>🥗</div>
      <h1 style={{ fontSize: '1.75rem', color: 'var(--color-text)', marginBottom: '8px' }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '28px', maxWidth: '360px' }}>
        This page doesn&apos;t exist. Maybe it got eaten? Let&apos;s go back to your dashboard.
      </p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
}

