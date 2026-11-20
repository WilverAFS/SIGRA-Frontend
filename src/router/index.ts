// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import HealthCheckView from '@/views/HealthCheckView.vue';
import { UserRole } from '@/types/roles';
import type { RouteRecordRaw } from 'vue-router';
import ForbiddenView from '@/views/errors/ForbiddenView.vue';
import { useAuthStore } from '@/stores/auth';
import { createPinia } from 'pinia';

const pinia = createPinia();

const routes: RouteRecordRaw[] = [
  {
    path: '/login', name: 'Login',
    component: LoginView, meta: { requiresAuth: false, },
  },
  {
    path: '/', name: 'Dashboard',
    component: DashboardView, meta: { requiresAuth: true, roles: [UserRole.ADMIN, UserRole.DOCENTE, UserRole.ESTUDIANTE,], },
  },
  {
    path: '/health', name: 'HealthCheck',
    component: HealthCheckView, meta: { requiresAuth: false, },
  },
  {
    path: '/403', name: 'Forbidden',
    component: ForbiddenView, meta: { requiresAuth: false, },
  },
];

const router = createRouter({ history: createWebHistory(), routes, });

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth ?? false;
  const allowedRoles = to.meta.roles;

  // Ruta protegida sin sesión
  if (requiresAuth && !authStore.isAuthenticated) { return '/login'; }

  // Usuario autenticado intentando volver al login
  if (to.path === '/login' && isAuthenticated) { return '/'; }

  // Validación de roles
  if (requiresAuth && allowedRoles && authStore.user && !allowedRoles.includes(authStore.user.role)) { return '/403'; }

  return true;
});

export default router;