// src/hooks/useAuth.js
// ---------------------------------------------------------
// Custom hook that wraps useContext(AuthContext).
//
// Why use a custom hook instead of calling useContext directly?
//   1. Gives a helpful error if used outside the Provider
//   2. Single import point — components import useAuth, not
//      both useContext and AuthContext
//   3. Easy to add logging or other logic later
// ---------------------------------------------------------

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside an <AuthProvider>. Wrap your app in AuthProvider.');
  }

  return context;
}

