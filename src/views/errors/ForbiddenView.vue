<template>
  <section class="forbidden-container">
    <h1>403</h1>

    <h2>Acceso denegado</h2>

    <p>
      No cuentas con permisos para acceder a este recurso.
    </p>

    <RouterLink to="/">
      Volver al dashboard
    </RouterLink>
  </section>
</template>

<style scoped>
.forbidden-container {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 5rem;
  margin: 0;
  color: #dc2626;
}

h2 {
  margin: 0;
}

p {
  max-width: 500px;
  color: #64748b;
}
</style>