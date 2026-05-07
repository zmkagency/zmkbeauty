import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:4000/api/v1";

export const TOKEN_KEYS = {
  ACCESS: "zmk_access_token",
  REFRESH: "zmk_refresh_token",
  USER: "zmk_user",
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

// Request: attach access token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response: auto-refresh on 401
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original: any = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/refresh")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken();
        }
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        refreshPromise = null;
        await clearTokens();
        throw e;
      }
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string> {
  const refresh = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
  if (!refresh) throw new Error("No refresh token");
  const { data } = await axios.post(`${API_URL}/auth/customer/refresh`, {
    refreshToken: refresh,
  });
  await saveTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, accessToken);
  await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.USER);
}

export async function getStoredUser() {
  const raw = await SecureStore.getItemAsync(TOKEN_KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync(TOKEN_KEYS.USER, JSON.stringify(user));
}

export default api;
