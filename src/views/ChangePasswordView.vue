<script setup lang="ts">
import { reactive, ref } from 'vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import { useAuthStore } from '@/stores/auth';
import { requerido, passwordSegura } from '@/utils/validaciones';

const authStore = useAuthStore();

const form = reactive({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
});

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
});

const successMessage = ref('');

function validate(): boolean {
  successMessage.value = '';
  errors.currentPassword = requerido(form.currentPassword) ?? '';
  errors.newPassword = requerido(form.newPassword)
    ?? passwordSegura(form.newPassword)
    ?? '';
  errors.newPasswordConfirmation = requerido(form.newPasswordConfirmation)
    ?? (form.newPassword !== form.newPasswordConfirmation
      ? 'Las contraseñas no coinciden.'
      : '');

  return !Object.values(errors).some(Boolean);
}

async function submit() {
  authStore.clearErrors();

  if (!validate()) return;

  const success = await authStore.changePassword({
    currentPassword: form.currentPassword,
    newPassword: form.newPassword,
    newPasswordConfirmation: form.newPasswordConfirmation,
  });

  if (success) {
    form.currentPassword = '';
    form.newPassword = '';
    form.newPasswordConfirmation = '';
    successMessage.value = 'Tu contraseña se actualizó correctamente.';
    return;
  }

  const serverErrors = authStore.validationErrors;
  errors.currentPassword = serverErrors.currentPassword
    ?? serverErrors.current_password
    ?? '';
  errors.newPassword = serverErrors.newPassword
    ?? serverErrors.new_password
    ?? '';
  errors.newPasswordConfirmation = serverErrors.newPasswordConfirmation
    ?? serverErrors.new_password_confirmation
    ?? '';
}
</script>

<template>
  <section class="password-page">
    <div class="password-card">
      <h1>Cambiar contraseña</h1>
      <p class="description">Actualiza la contraseña de tu cuenta institucional.</p>

      <form @submit.prevent="submit" novalidate>
        <BaseInput
          id="currentPassword"
          v-model="form.currentPassword"
          label="Contraseña actual"
          type="password"
          required
          :error="errors.currentPassword"
        />

        <BaseInput
          id="newPassword"
          v-model="form.newPassword"
          label="Nueva contraseña"
          type="password"
          required
          :error="errors.newPassword"
        />

        <BaseInput
          id="newPasswordConfirmation"
          v-model="form.newPasswordConfirmation"
          label="Confirmar nueva contraseña"
          type="password"
          required
          :error="errors.newPasswordConfirmation"
        />

        <p v-if="authStore.error" class="server-error" role="alert">
          {{ authStore.error }}
        </p>

        <p v-if="successMessage" class="success-message" role="status">
          {{ successMessage }}
        </p>

        <button type="submit" :disabled="authStore.loading">
          {{ authStore.loading ? 'Actualizando...' : 'Actualizar contraseña' }}
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.password-page { width: 100%; max-width: 680px; margin: 0 auto; padding: 2rem; }
.password-card { padding: 2rem; border-radius: .75rem; background: white; box-shadow: 0 4px 12px rgb(0 0 0 / 8%); }
h1 { margin-top: 0; color: #31456e; }
.description { margin-bottom: 1.5rem; color: #64748b; }
form { display: flex; flex-direction: column; gap: 1rem; }
button { padding: .85rem; border: 0; border-radius: .5rem; background: #31456e; color: white; font-weight: 600; cursor: pointer; }
button:disabled { opacity: .7; cursor: not-allowed; }
.server-error { margin: 0; color: #dc2626; }
.success-message { margin: 0; color: #15803d; }
@media (max-width: 600px) { .password-page { padding: 1rem; } .password-card { padding: 1.25rem; } }
</style>
