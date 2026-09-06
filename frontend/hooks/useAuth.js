'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = typeof window === 'undefined' ? null : localStorage.getItem('arc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.me();
      setUser(response.user ?? null);
    } catch {
      localStorage.removeItem('arc_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const login = useCallback(async (credentials) => {
    const response = await api.login(credentials);
    localStorage.setItem('arc_token', response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('arc_token');
    setUser(null);
  }, []);

  return { user, loading, login, logout, reload: load };
}
