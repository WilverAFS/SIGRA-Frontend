<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';

import {
  guestNavigation,
  navigationByRole,
} from '@/config/navigation';

const router = useRouter();
const authStore = useAuthStore();

const menuItems = computed(() => {
  if (!authStore.isAuthenticated) {
    return guestNavigation;
  }

  const items =
    navigationByRole[authStore.user!.role] ?? [];

  return items.filter(
    (item) => item.enabled !== false
  );
});

async function logout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<template>
  <nav class="navbar" aria-label="Navegación principal">
    <RouterLink v-for="item in menuItems" :key="item.route" :to="item.route" class="nav-link">
      {{ item.label }}
    </RouterLink>

    <button v-if="authStore.isAuthenticated" type="button" class="logout-button" @click="logout">
      Cerrar sesión
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  border-radius: 0.25rem;
}

.nav-link:focus-visible,
.logout-button:focus-visible {
  outline: 3px solid var(--color-primary, #2563eb);
  outline-offset: 3px;
}

.nav-link.router-link-active {
  font-weight: 700;
}

.logout-button {
  margin-left: auto;
  cursor: pointer;
}
</style>