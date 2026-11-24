import axios, {
  type InternalAxiosRequestConfig,
} from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('La variable VITE_API_URL es obligatoria.');
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<boolean> | null = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sigra_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const url = originalRequest?.url ?? '';

    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
    ];

    const isPublicAuthRequest = publicAuthEndpoints.some(
      (endpoint) => url.includes(endpoint)
    );

    if (
      status !== 401
      || !originalRequest
      || originalRequest._retry
      || isPublicAuthRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = import('@/stores/auth')
          .then(({ useAuthStore }) => {
            return useAuthStore().refreshSession();
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshed = await refreshPromise;

      if (!refreshed) {
        window.dispatchEvent(new Event('sigra:session-expired'));
        return Promise.reject(error);
      }

      const newToken = localStorage.getItem('sigra_token');

      if (!newToken) {
        window.dispatchEvent(new Event('sigra:session-expired'));
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      window.dispatchEvent(new Event('sigra:session-expired'));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
