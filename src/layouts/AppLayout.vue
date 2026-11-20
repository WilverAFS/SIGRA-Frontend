<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import AppNavbar from '@/components/layout/AppNavbar.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
</script>

<template>
  <div class="app-layout">
    <AppHeader />

    <AppNavbar />

    <main>
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>