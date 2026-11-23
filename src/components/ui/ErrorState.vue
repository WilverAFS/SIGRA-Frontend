<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="error-state" role="alert">
    {{ message ?? 'Ocurrió un error.' }}
  </div>
</template>

<style scoped>
.error-state {
  padding: 1rem;
  border: 1px solid #dc2626;
  border-radius: 0.5rem;
  color: #991b1b;
  background: #fef2f2;
}
</style>
