// src/components/ProtectedRoute.jsx
// ---------------------------------------------------------
// Guards routes that require the user to be logged in.
//
// How it works:
//   1. While auth is loading (checking localStorage), show spinner
//   2. If not authenticated, redirect to /login
//   3. If authenticated, render the wrapped children
//
// Usage in App.jsx:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// ---------------------------------------------------------

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show spinner while localStorage auth check runs (< 50ms)
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <LoadingSpinner size="lg" message="Loading NutriScan..." />
      </div>
    );
  }

  // Not logged in → redirect to login, keeping the intended URL
  // in state so we can redirect back after login (Phase 3)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

