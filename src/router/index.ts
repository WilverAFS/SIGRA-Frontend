// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import HealthCheckView from '@/views/HealthCheckView.vue';
import { UserRole } from '@/types/roles';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      roles: [
        UserRole.ADMIN,
        UserRole.DOCENTE,
        UserRole.ESTUDIANTE,
      ],
    },
  },
  {
    path: '/health',
    name: 'HealthCheck',
    component: HealthCheckView, // Ruta de diagnóstico
    meta: {
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;