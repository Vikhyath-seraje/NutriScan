// src/App.jsx
// ---------------------------------------------------------
// Root component — sets up React Router and wraps the entire
// app in AuthProvider so every component can read auth state.
//
// Route structure:
//   /             → redirect to /dashboard or /login
//   /login        → public
//   /register     → public
//   /dashboard    → protected (requires login)
//   /scanner      → protected
//   /diary        → protected
//   /profile      → protected
//   *             → 404 NotFound
//
// Protected routes use <ProtectedRoute> which redirects to
// /login if the user is not authenticated.
// MainLayout wraps all protected routes with Navbar + footer.
// ---------------------------------------------------------

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

import Login     from './pages/Login';
import Register  from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scanner   from './pages/Scanner';
import Diary     from './pages/Diary';
import Profile   from './pages/Profile';
import NotFound  from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes — no login required */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root redirect — goes to dashboard (ProtectedRoute handles redirect to login if needed) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes — wrapped in MainLayout (Navbar + footer) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scanner"   element={<Scanner />} />
            <Route path="/diary"     element={<Diary />} />
            <Route path="/profile"   element={<Profile />} />
          </Route>

          {/* 404 — catch all unmatched routes */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
