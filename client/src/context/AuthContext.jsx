import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('rurify_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rurify_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .fetchMe()
      .then((me) => {
        setUser((prev) => ({ ...prev, ...me }));
      })
      .catch(() => {
        localStorage.removeItem('rurify_token');
        localStorage.removeItem('rurify_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: loggedInUser } = await authService.login(credentials);
    localStorage.setItem('rurify_token', token);
    localStorage.setItem('rurify_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: newUser } = await authService.register(payload);
    localStorage.setItem('rurify_token', token);
    localStorage.setItem('rurify_user', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('rurify_token');
    localStorage.removeItem('rurify_user');
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
