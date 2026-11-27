<script setup lang="ts">
const page = defineModel<number>('page', {
  required: true,
});

defineProps<{
  totalPages: number;
}>();
</script>

<template>
  <nav
    class="pagination"
    aria-label="Paginación"
  >
    <button
      type="button"
      class="pagination-button"
      :disabled="page <= 1"
      @click="page = page - 1"
    >
      Anterior
    </button>

    <span class="pagination-info">
      Página {{ page }} de {{ totalPages }}
    </span>

    <button
      type="button"
      class="pagination-button"
      :disabled="page >= totalPages"
      @click="page = page + 1"
    >
      Siguiente
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 0;
}

.pagination-button {
  padding: .5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
}

.pagination-button:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pagination-button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.pagination-info {
  color: var(--color-text-secondary);
  font-size: .875rem;
}
</style>