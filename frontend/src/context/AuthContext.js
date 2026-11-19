import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = localStorage.getItem('cf_user');
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);
  const [token, setToken] = useState(localStorage.getItem('cf_token') || null);

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('cf_token', res.data.token);
    localStorage.setItem('cf_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const res = await axios.post('/api/auth/register', { name, email, password, role });
    localStorage.setItem('cf_token', res.data.token);
    localStorage.setItem('cf_user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_user');
    setToken(null);
    setUser(null);
  }, []);

  // Axios interceptor to attach token
  axios.interceptors.request.use(cfg => {
    const t = localStorage.getItem('cf_token');
    if (t) cfg.headers.Authorization = `Bearer ${t}`;
    return cfg;
  });

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
