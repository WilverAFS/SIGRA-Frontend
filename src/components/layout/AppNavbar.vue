<template>
  <nav class="navbar">
    <RouterLink to="/">
      Dashboard
    </RouterLink>

    <RouterLink to="/login">
      Iniciar sesión
    </RouterLink>

    <RouterLink to="/health">
      Test conexión backend
    </RouterLink>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}
</style>