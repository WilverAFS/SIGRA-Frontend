<script setup lang="ts">
// Aquí se agregara la lógica global o barras de navegación en el futuro
</script>

<template>
  <header style="padding: 1rem; background-color: #31456e; border-bottom: 1px solid #505153;">
    <h1 style="margin: 0; font-size: 1.25rem; font-family: sans-serif;">SIGRA — Instituto Tecnológico de Oaxaca</h1>
    <nav style="margin-top: 0.5rem; display: flex; gap: 1rem;">
      <router-link to="/">Dashboard</router-link>
      <router-link to="/login">Iniciar Sesión</router-link>
      <router-link to="/health">Test Conexión Backend</router-link>
    </nav>
  </header>

  <!-- El componente RouterView renderiza la vista correspondiente a la URL actual -->
  <main>
    <router-view />
  </main>
</template>

<style>
/* Estilos globales básicos opcionales */
body {
  margin: 0;
  font-family: sans-serif;
}
</style>