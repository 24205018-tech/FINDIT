import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authAPI, getToken, setToken } from '../services/api.js';
import { avatarFor } from '../utils/mockImage.js';

export const AuthContext = createContext(null);

/**
 * AuthContext — now connected to real backend (Node.js + MySQL)
 * - Stores JWT in localStorage (findit_token)
 * - Hydrates session via GET /api/auth/me
 * - Login/register via POST /api/auth/*
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate session from JWT
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI.me()
      .then(res => {
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          setToken(null);
        }
      })
      .catch(() => {
        // Token invalid or backend down
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email: email.trim().toLowerCase(), password });
    if (res.success && res.data) {
      const { user: u, token } = res.data;
      setToken(token);
      setUser(u);
      return u;
    }
    throw new Error(res.message || 'Login failed');
  }, []);

  const register = useCallback(async ({ name, email, phone, password }) => {
    const res = await authAPI.register({ name, email: email.trim().toLowerCase(), phone, password });
    if (res.success && res.data) {
      // Auto-login after register if token returned
      if (res.data.token) {
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.data.user || res.data;
    }
    throw new Error(res.message || 'Registration failed');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    try {
      const res = await authAPI.updateProfile(patch);
      if (res.success && res.data) {
        setUser(res.data);
        return res.data;
      }
      // Fallback: optimistic update
      setUser(prev => prev ? { ...prev, ...patch } : prev);
      return patch;
    } catch (err) {
      // Optimistic update if backend fails (offline demo)
      setUser(prev => prev ? { ...prev, ...patch } : prev);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user && user.role === 'admin'),
      login,
      register,
      logout,
      updateProfile,
      photoUrl: user && user.photo ? user.photo : user ? avatarFor(user.name) : '',
    }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
