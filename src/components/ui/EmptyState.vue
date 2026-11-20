<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="empty-state">
    {{ message ?? 'No hay información disponible.' }}
  </div>
</template>