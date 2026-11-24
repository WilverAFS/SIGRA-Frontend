<template>
  <div
    class="loading-state"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <span class="loading-indicator" aria-hidden="true"></span>
    <span>Cargando información...</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.loading-indicator {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-primary, #2563eb);
  border-radius: 50%;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-indicator {
    animation: none;
  }
}
</style>
