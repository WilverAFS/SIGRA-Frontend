import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

import LoginView from '@/views/LoginView.vue';
import DashboardView from '@/views/DashboardView.vue';
import HealthCheckView from '@/views/HealthCheckView.vue';
import AuditView from '@/views/AuditView.vue';
import ForbiddenView from '@/views/errors/ForbiddenView.vue';

import { UserRole } from '@/types/roles';
import { useAuthStore } from '@/stores/auth';

import AuthLayout from '@/layouts/AuthLayout.vue';
import AppLayout from '@/layouts/AppLayout.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: {
      requiresAuth: false,
      layout: AuthLayout,
    },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      layout: AppLayout,
      roles: [UserRole.ADMIN, UserRole.DOCENTE, UserRole.ESTUDIANTE],
    },
  },
  {
    path: '/admin/auditoria',
    name: 'Audit',
    component: AuditView,
    meta: {
      requiresAuth: true,
      layout: AppLayout,
      roles: [UserRole.ADMIN],
    },
  },
  {
    path: '/health',
    name: 'HealthCheck',
    component: HealthCheckView,
    meta: {
      requiresAuth: false,
      layout: AppLayout,
    },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: ForbiddenView,
    meta: {
      requiresAuth: false,
      layout: AppLayout,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth ?? false;
  const allowedRoles = to.meta.roles;

  if (requiresAuth && !isAuthenticated) {
    return '/login';
  }

  if (to.path === '/login' && isAuthenticated) {
    return '/';
  }

  if (
    requiresAuth
    && allowedRoles
    && authStore.user
    && !allowedRoles.includes(authStore.user.role)
  ) {
    return '/403';
  }

  return true;
});

export default router;
