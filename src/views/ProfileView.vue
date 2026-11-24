<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.fetchMe();
});
</script>

<template>
  <section class="profile-page">
    <header class="page-header">
      <h1>Mi perfil</h1>
      <p>Consulta tu información institucional.</p>
    </header>

    <div v-if="authStore.loading" class="status-message">
      Cargando información del perfil...
    </div>

    <div v-else-if="authStore.error" class="error-message" role="alert">
      {{ authStore.error }}
      <button type="button" @click="authStore.fetchMe()">Reintentar</button>
    </div>

    <article v-else-if="authStore.user" class="profile-card">
      <div class="profile-avatar" aria-hidden="true">
        {{ authStore.user.firstName.charAt(0) }}{{ authStore.user.lastName.charAt(0) }}
      </div>

      <h2>{{ authStore.fullName }}</h2>
      <p class="profile-role">{{ authStore.user.role }}</p>

      <dl class="profile-data">
        <div>
          <dt>Identificador institucional</dt>
          <dd>{{ authStore.user.institutionalId }}</dd>
        </div>
        <div>
          <dt>Correo electrónico</dt>
          <dd>{{ authStore.user.email }}</dd>
        </div>
        <div>
          <dt>ID del instituto</dt>
          <dd>{{ authStore.user.instituteId }}</dd>
        </div>
        <div>
          <dt>ID de carrera</dt>
          <dd>{{ authStore.user.careerId ?? 'No especificada' }}</dd>
        </div>
        <div>
          <dt>Estado de cuenta</dt>
          <dd>{{ authStore.user.isActive ? 'Activa' : 'Inactiva' }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<style scoped>
.profile-page { width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem; }
.page-header h1 { margin-bottom: .4rem; color: #31456e; }
.page-header p { color: #64748b; }
.profile-card { margin-top: 1.5rem; padding: 2rem; border-radius: .75rem; background: white; box-shadow: 0 4px 12px rgb(0 0 0 / 8%); }
.profile-avatar { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; background: #31456e; color: white; font-size: 1.4rem; font-weight: 700; }
.profile-card h2 { margin-bottom: .25rem; }
.profile-role { color: #64748b; }
.profile-data { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 2rem; }
.profile-data div { padding: 1rem; border-radius: .5rem; background: #f8fafc; }
dt { color: #64748b; font-size: .875rem; }
dd { margin: .35rem 0 0; font-weight: 600; overflow-wrap: anywhere; }
.status-message, .error-message { margin-top: 1.5rem; padding: 1rem; border-radius: .5rem; background: #f8fafc; }
.error-message { color: #b91c1c; }
.error-message button { display: block; margin-top: .75rem; }
@media (max-width: 600px) {
  .profile-page { padding: 1rem; }
  .profile-data { grid-template-columns: 1fr; }
}
</style>
