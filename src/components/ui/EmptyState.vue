<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div
    class="empty-state"
    role="status"
    aria-live="polite"
  >
    {{ message ?? 'No hay información disponible.' }}
  </div>
</template>

<style scoped>
.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--color-text-secondary, #6b7280);
}
</style>
