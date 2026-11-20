// src/types/router.ts

import 'vue-router';
import type { UserRole } from './roles';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: UserRole[];
  }
}