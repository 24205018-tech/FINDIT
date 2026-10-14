import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Convenience hook — the real logic lives in AuthContext.
 * useAuth() => { user, role, isAuthenticated, isAdmin, login, register,
 *                logout, updateProfile }
 */
export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
