<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import BaseInput from '@/components/forms/BaseInput.vue';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types/roles';
import {
  requerido,
  correoValido,
  passwordSegura,
  soloLetras,
  soloNumeros,
} from '@/utils/validaciones';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  institutionalId: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'ESTUDIANTE' as 'DOCENTE' | 'ESTUDIANTE',
  instituteId: '',
  careerId: '',
});

const errors = reactive<Record<string, string>>({});
const pendingApproval = ref(false);

const passwordRules = computed(() => [
  { label: 'Al menos 8 caracteres', valid: form.password.length >= 8 },
  { label: 'Una letra mayúscula', valid: /[A-Z]/.test(form.password) },
  { label: 'Una letra minúscula', valid: /[a-z]/.test(form.password) },
  { label: 'Un número', valid: /\d/.test(form.password) },
  { label: 'Un símbolo', valid: /[^A-Za-z\d]/.test(form.password) },
]);

function clearFieldErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function validarFormulario(): boolean {
  clearFieldErrors();

  errors.institutionalId = requerido(form.institutionalId) ?? '';
  errors.firstName = requerido(form.firstName)
    ?? soloLetras(form.firstName)
    ?? '';
  errors.lastName = requerido(form.lastName)
    ?? soloLetras(form.lastName)
    ?? '';
  errors.email = requerido(form.email)
    ?? correoValido(form.email)
    ?? '';
  errors.password = requerido(form.password)
    ?? passwordSegura(form.password)
    ?? '';
  errors.instituteId = requerido(String(form.instituteId))
    ?? soloNumeros(String(form.instituteId))
    ?? '';
  errors.careerId = requerido(String(form.careerId))
    ?? soloNumeros(String(form.careerId))
    ?? (Number.isInteger(Number(form.careerId)) && Number(form.careerId) > 0
      ? ''
      : 'El ID de carrera debe ser un entero positivo.');

  return !Object.values(errors).some(Boolean);
}

function applyServerErrors() {
  const aliases: Record<string, string[]> = {
    institutionalId: ['institutionalId', 'institutional_id', 'matricula'],
    firstName: ['firstName', 'first_name', 'nombre'],
    lastName: ['lastName', 'last_name', 'apellidos'],
    email: ['email', 'correo'],
    password: ['password', 'contrasena'],
    instituteId: ['instituteId', 'institute_id', 'instituto_id'],
    careerId: ['careerId', 'career_id', 'carrera_id'],
    role: ['role', 'rol'],
  };

  for (const [field, keys] of Object.entries(aliases)) {
    const message = keys
      .map((key) => authStore.validationErrors[key])
      .find(Boolean);

    if (message) errors[field] = message;
  }
}

async function submit() {
  pendingApproval.value = false;
  authStore.clearErrors();

  if (!validarFormulario()) return;

  const result = await authStore.register({
    institutionalId: form.institutionalId.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
    role: form.role,
    instituteId: Number(form.instituteId),
    careerId: Number(form.careerId),
  });

  if (result === 'active') {
    await router.push('/');
    return;
  }

  if (result === 'pending') {
    pendingApproval.value = true;
    return;
  }

  applyServerErrors();
}
</script>

<template>
  <section class="register-container">
    <div class="register-card">
      <header>
        <h1>Crear cuenta</h1>
        <p>Registro de usuarios de SIGRA</p>
      </header>

      <div v-if="pendingApproval" class="notice" role="status">
        <h2>Registro recibido</h2>
        <p>
          Tu cuenta de docente fue creada y está pendiente de aprobación
          por parte de un administrador. Podrás iniciar sesión cuando sea activada.
        </p>
        <RouterLink to="/login">Volver al inicio de sesión</RouterLink>
      </div>

      <form v-else @submit.prevent="submit" novalidate>
        <BaseInput
          id="institutionalId"
          v-model="form.institutionalId"
          label="Matrícula o identificador institucional"
          placeholder="Ingresa tu identificador"
          required
          :error="errors.institutionalId"
        />

        <div class="form-grid">
          <BaseInput
            id="firstName"
            v-model="form.firstName"
            label="Nombre(s)"
            placeholder="Nombre(s)"
            required
            :error="errors.firstName"
          />
          <BaseInput
            id="lastName"
            v-model="form.lastName"
            label="Apellidos"
            placeholder="Apellidos"
            required
            :error="errors.lastName"
          />
        </div>

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
          placeholder="Crea una contraseña segura"
          required
          :error="errors.password"
        />

        <div class="password-rules" aria-live="polite">
          <p>La contraseña debe contener:</p>
          <ul>
            <li v-for="rule in passwordRules" :key="rule.label" :class="{ valid: rule.valid }">
              <span aria-hidden="true">{{ rule.valid ? '✓' : '○' }}</span>
              {{ rule.label }}
            </li>
          </ul>
        </div>

        <div class="form-group">
          <label for="role">Tipo de cuenta *</label>
          <select id="role" v-model="form.role" required>
            <option :value="UserRole.ESTUDIANTE">Estudiante</option>
            <option :value="UserRole.DOCENTE">Docente</option>
          </select>
          <small v-if="errors.role" class="field-error">{{ errors.role }}</small>
          <small v-if="form.role === UserRole.DOCENTE" class="help-text">
            Las cuentas de docente requieren aprobación de un administrador.
          </small>
        </div>

        <div class="form-grid">
          <BaseInput
            id="instituteId"
            v-model="form.instituteId"
            label="ID del instituto"
            type="number"
            placeholder="Identificador numérico"
            required
            :error="errors.instituteId"
          />
          <BaseInput
            id="careerId"
            v-model="form.careerId"
            label="ID de carrera"
            type="number"
            placeholder="Ingresa el ID de tu carrera"
            required
            :error="errors.careerId"
          />
        </div>

        <p v-if="authStore.error" class="server-error" role="alert">
          {{ authStore.error }}
        </p>

        <button type="submit" class="submit-button" :disabled="authStore.loading">
          {{ authStore.loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </button>
      </form>

      <p v-if="!pendingApproval" class="login-link">
        ¿Ya tienes una cuenta?
        <RouterLink to="/login">Iniciar sesión</RouterLink>
      </p>
    </div>
  </section>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 1rem;
  background: #f8fafc;
}
.register-card {
  width: 100%;
  max-width: 720px;
  padding: 2rem;
  background: white;
  border-radius: .75rem;
  box-shadow: 0 4px 10px rgb(0 0 0 / 10%);
}
header h1 { margin: 0 0 .4rem; color: #31456e; }
header p { margin: 0 0 1.5rem; color: #64748b; }
form { display: flex; flex-direction: column; gap: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: .4rem; }
.form-group label { font-weight: 600; }
.form-group select {
  width: 100%;
  padding: .75rem;
  border: 1px solid #d1d5db;
  border-radius: .375rem;
  background: white;
}
.password-rules {
  padding: .75rem 1rem;
  border-radius: .5rem;
  background: #f8fafc;
  color: #64748b;
  font-size: .875rem;
}
.password-rules p { margin: 0 0 .4rem; font-weight: 600; }
.password-rules ul { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .3rem 1rem; margin: 0; padding: 0; list-style: none; }
.password-rules li.valid { color: #15803d; }
.help-text { color: #64748b; }
.field-error, .server-error { color: #dc2626; }
.server-error { margin: 0; }
.notice { padding: 1rem; border-radius: .5rem; background: #eff6ff; color: #1e3a8a; }
.notice h2 { margin-top: 0; }
.notice a, .login-link a { color: #31456e; font-weight: 600; }
.submit-button {
  padding: .85rem;
  border: 0;
  border-radius: .5rem;
  background: #31456e;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
.submit-button:disabled { opacity: .7; cursor: not-allowed; }
.login-link { margin: 1.5rem 0 0; text-align: center; }
@media (max-width: 600px) {
  .register-card { padding: 1.25rem; }
  .form-grid, .password-rules ul { grid-template-columns: 1fr; }
}
</style>
