import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach tenant header to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Auto-attach x-tenant-id header when the logged-in user belongs to a tenant.
    // The backend TenantGuard uses this to enforce multi-tenant isolation on
    // routes that are not already scoped by :tenantId in the path.
    // Callers can still override by setting the header explicitly.
    if (!config.headers['x-tenant-id']) {
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.tenantId) {
            config.headers['x-tenant-id'] = u.tenantId;
          }
        }
      } catch {
        // ignore malformed user payload
      }
    }
  }
  return config;
});

// Handle 401 → attempt refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        
        return api(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
