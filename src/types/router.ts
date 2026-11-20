// src/types/router.ts

import 'vue-router';
import type { UserRole } from './roles';
import type { Component } from 'vue';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: UserRole[];
    layout?: Component;
  }
}