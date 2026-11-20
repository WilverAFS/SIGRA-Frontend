// src/services/api.ts
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

// Interceptor para inyectar automáticamente el token JWT cuando esté disponible
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sigra_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sigra_token');
      localStorage.removeItem('sigra_user');
    }

    return Promise.reject(error);
  }
);

export default api;