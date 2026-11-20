<script setup lang="ts">
import logo from '@/assets/sigra-icono.webp';
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="brand">
      <img :src="logo" alt="Logo de SIGRA" class="brand-logo">

      <div class="brand-content">
        <h1>SIGRA</h1>

        <span>
          Sistema de Gestión de Recursos Académicos
        </span>
      </div>
    </RouterLink>

  </header>
</template>

<style scoped>
.header {
  padding: 1rem 1.5rem;
  background-color: var(--color-primary);
  border-bottom: 1px solid var(--color-border);
  color: white;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: inherit;
}
.brand-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-content {
  display: flex;
  flex-direction: column;
}

.brand-content h1 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.brand-content span {
  font-size: 0.9rem;
  opacity: 0.9;
}

@media (max-width: 640px) {
  .brand-logo {
    width: 44px;
    height: 44px;
  }

  .brand-content h1 {
    font-size: 1.1rem;
  }

  .brand-content span {
    font-size: 0.75rem;
  }
}
</style>