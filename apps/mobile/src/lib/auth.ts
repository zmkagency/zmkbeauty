import { create } from "zustand";
import api, { saveTokens, saveUser, getStoredUser, clearTokens, TOKEN_KEYS } from "./api";
import * as SecureStore from "expo-secure-store";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    city?: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    deviceToken?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  completeOnboarding: () => Promise<void>;
}

const ONBOARDING_KEY = "zmk_onboarded";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasOnboarded: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/customer/login", { email, password });
    await saveTokens(data.accessToken, data.refreshToken);
    await saveUser(data.user);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  register: async (regData) => {
    const { data } = await api.post("/auth/customer/register", {
      ...regData,
      source: "mobile",
    });
    await saveTokens(data.accessToken, data.refreshToken);
    await saveUser(data.user);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  bootstrap: async () => {
    try {
      const [user, onboarded] = await Promise.all([
        getStoredUser(),
        SecureStore.getItemAsync(ONBOARDING_KEY),
      ]);

      if (user) {
        // Try fetching fresh user data
        try {
          const { data } = await api.get("/auth/me");
          await saveUser(data);
          set({ user: data, isAuthenticated: true, hasOnboarded: onboarded === "true" });
        } catch {
          set({ user, isAuthenticated: true, hasOnboarded: onboarded === "true" });
        }
      } else {
        set({ isAuthenticated: false, hasOnboarded: onboarded === "true" });
      }
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    saveUser(updated);
    set({ user: updated });
  },

  completeOnboarding: async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    set({ hasOnboarded: true });
  },
}));
