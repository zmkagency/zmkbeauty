import { create } from 'zustand';
import api from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'STORE_ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  tenantId?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginCustomer: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; tenantId?: string }) => Promise<void>;
  registerCustomer: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string; tenantId: string }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  loginCustomer: async (email, password) => {
    const { data } = await api.post('/auth/customer/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (regData) => {
    const { data } = await api.post('/auth/register', regData);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  registerCustomer: async (regData) => {
    const { data } = await api.post('/auth/customer/register', regData);
    localStorage.setItem('user', JSON.stringify(data.user));
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        set({ user: JSON.parse(stored), isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    }
  },
}));
