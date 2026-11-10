// src/context/AuthContext.jsx
// ---------------------------------------------------------
// Global authentication state using React Context API.
//
// What it does:
//   - Stores the logged-in user object and JWT token
//   - Reads saved auth data from localStorage on startup
//     (so the user stays logged in after a page refresh)
//   - Provides login(), logout() functions to all children
//   - Exposes isAuthenticated and isLoading flags
//
// How Context API works (for viva):
//   createContext() creates a "box" that any component can
//   read from without prop-drilling. The Provider wraps the
//   whole app and makes the value available everywhere.
//   useContext(AuthContext) reads from the nearest Provider.
// ---------------------------------------------------------

import { createContext, useState, useEffect, useCallback } from 'react';

// Create the context object — this is what components import
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: the logged-in user object (name, email, _id, etc.)
  // null means not logged in
  const [user, setUser] = useState(null);

  // isLoading: true while we're checking localStorage on startup
  // Prevents a flash of "not logged in" before we've checked
  const [isLoading, setIsLoading] = useState(true);

  // ── On mount: restore session from localStorage ──────────
  // localStorage persists across browser tabs and refreshes.
  // We store a compact JSON string; on mount we parse it back.
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('nutriscan_token');
      const savedUser = localStorage.getItem('nutriscan_user');

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (err) {
      // If JSON.parse fails (corrupted data), clear storage
      console.error('Failed to restore auth session:', err);
      localStorage.removeItem('nutriscan_token');
      localStorage.removeItem('nutriscan_user');
    } finally {
      // Always stop the loading state, even if restoration failed
      setIsLoading(false);
    }
  }, []);

  // ── login(): called after a successful /api/auth/login ───
  // token: the JWT string from the server
  // userData: the user object (name, email, _id, profile, etc.)
  const login = useCallback((token, userData) => {
    localStorage.setItem('nutriscan_token', token);
    localStorage.setItem('nutriscan_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── logout(): clears all stored auth data ────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('nutriscan_token');
    localStorage.removeItem('nutriscan_user');
    setUser(null);
  }, []);

  // ── updateUser(): merge in profile changes without re-login
  // Called after the user edits their profile (Phase 4)
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('nutriscan_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  // The value object is what all consumers receive
  const value = {
    user,                              // null | { _id, name, email, profile, calorieGoal }
    isAuthenticated: !!user,           // convenience boolean
    isLoading,                         // true during initial localStorage check
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

