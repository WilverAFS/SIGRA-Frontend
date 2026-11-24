import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    'La variable VITE_API_URL es obligatoria.'
  );
}

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';

    const publicAuthEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
    ];

    const isPublicAuthRequest = publicAuthEndpoints.some(
      (endpoint) => url.includes(endpoint)
    );

    if (status === 401 && !isPublicAuthRequest) {
      window.dispatchEvent(
        new Event('sigra:session-expired')
      );
    }

    return Promise.reject(error);
  }
);

export default api;
