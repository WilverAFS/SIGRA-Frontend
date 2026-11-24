<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import BaseInput from '@/components/forms/BaseInput.vue';
import { useAuthStore } from '@/stores/auth';
import { requerido, correoValido } from '@/utils/validaciones';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: '',
  password: '',
});

const errors = reactive({
  email: '',
  password: '',
});

function validarFormulario(): boolean {
  errors.email = requerido(form.email)
    ?? correoValido(form.email)
    ?? '';

  errors.password = requerido(form.password) ?? '';

  return !errors.email && !errors.password;
}

async function submit() {
  authStore.clearErrors();

  if (!validarFormulario()) return;

  const success = await authStore.login({
    email: form.email.trim(),
    password: form.password,
  });

  if (success) {
    await router.push('/');
    return;
  }

  errors.email = authStore.validationErrors.email
    ?? authStore.validationErrors.correo
    ?? '';

  errors.password = authStore.validationErrors.password
    ?? authStore.validationErrors.contrasena
    ?? authStore.validationErrors['credentials.password']
    ?? '';
}
</script>

<template>
  <section class="login-container">
    <div class="login-card">
      <h1>SIGRA</h1>
      <p>Acceso institucional</p>

      <form @submit.prevent="submit">
        <BaseInput
          id="email"
          v-model="form.email"
          label="Correo electrónico"
          type="email"
          placeholder="usuario@itoaxaca.edu.mx"
          required
          :error="errors.email"
        />

        <BaseInput
          id="password"
          v-model="form.password"
          label="Contraseña"
          type="password"
          placeholder="Ingrese su contraseña"
          required
          :error="errors.password"
        />

        <p v-if="authStore.error && !errors.email && !errors.password" class="server-error" role="alert">
          {{ authStore.error }}
        </p>

        <button type="submit" class="login-button" :disabled="authStore.loading">
          {{ authStore.loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
      </form>

      <p class="register-link">
        ¿No tienes una cuenta?
        <RouterLink to="/registro">Crear cuenta</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  padding: 2rem 1rem;
}
.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 2rem;
  border-radius: .75rem;
  box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
}
.login-card h1 { margin: 0 0 .5rem; color: #31456e; }
.login-card > p { margin: 0 0 1.5rem; color: #64748b; }
form { display: flex; flex-direction: column; gap: 1rem; }
.login-button {
  padding: .85rem;
  border: none;
  border-radius: .5rem;
  cursor: pointer;
  background: #31456e;
  color: white;
  font-weight: 600;
}
.login-button:disabled { opacity: .7; cursor: not-allowed; }
.server-error { color: #dc2626; margin: 0; }
.register-link { margin: 1.5rem 0 0 !important; text-align: center; }
.register-link a { color: #31456e; font-weight: 600; }
</style>
