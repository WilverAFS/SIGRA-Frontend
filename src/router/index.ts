import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import HealthCheckView from '@/views/HealthCheckView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
  },
  {
    path: '/health',
    name: 'HealthCheck',
    component: HealthCheckView, // Ruta de diagnóstico
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;