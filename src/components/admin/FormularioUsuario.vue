<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import BaseSelect from '@/components/forms/BaseSelect.vue';
import {
  requerido,
  soloLetras,
  correoValido,
  passwordSegura,
  longitudMaxima,
} from '@/utils/validaciones';
import { obtenerErroresPorCampo } from '@/utils/errores-api';
import { UserRole } from '@/types/roles';
import type { Carrera } from '@/types/carreras';
import type { Usuario, UsuarioCambios, UsuarioNuevo } from '@/types/usuarios';
import type { SelectOption } from '@/types/ui';

type Campo =
  | 'institutionalId'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'role'
  | 'instituteId'
  | 'careerId';

const props = defineProps<{
  usuario?: Usuario | null;
  institutos: SelectOption[];
  carreras: Carrera[];
  guardando?: boolean;
  errorApi?: unknown;
  mensajeError?: string | null;
}>();

const emit = defineEmits<{
  guardar: [payload: UsuarioNuevo | UsuarioCambios];
  cancelar: [];
}>();

const etiquetasRoles: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

const opcionesRoles: SelectOption[] = Object.values(UserRole).map((rol) => ({
  value: rol,
  label: etiquetasRoles[rol] ?? rol,
}));

const esEdicion = computed(() => Boolean(props.usuario));

const camposActivos = computed<Campo[]>(() =>
  esEdicion.value
    ? ['firstName', 'lastName', 'role', 'careerId']
    : [
      'institutionalId',
      'firstName',
      'lastName',
      'email',
      'password',
      'role',
      'instituteId',
      'careerId',
    ]
);

const valores = reactive({
  institutionalId: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: '' as string | number,
  instituteId: '' as string | number,
  careerId: '' as string | number,
  isActive: true,
});

const errores = reactive<Record<Campo, string | null>>({
  institutionalId: null,
  firstName: null,
  lastName: null,
  email: null,
  password: null,
  role: null,
  instituteId: null,
  careerId: null,
});

const esAdmin = computed(() => valores.role === UserRole.ADMIN);

// Solo se ofrecen las carreras del instituto elegido
const opcionesCarreras = computed<SelectOption[]>(() =>
  props.carreras
    .filter(
      (carrera) =>
        valores.instituteId === ''
        || carrera.instituteId === Number(valores.instituteId)
    )
    .map((carrera) => ({
      value: carrera.id,
      label: `${carrera.shortName} - ${carrera.name}`,
    }))
);

function validarCampo(campo: Campo): string | null {
  const texto = String(valores[campo] ?? '');

  switch (campo) {
    case 'institutionalId':
      return requerido(texto) ?? longitudMaxima(texto, 30);
    case 'firstName':
      return requerido(texto) ?? soloLetras(texto) ?? longitudMaxima(texto, 100);
    case 'lastName':
      return requerido(texto) ?? soloLetras(texto) ?? longitudMaxima(texto, 120);
    case 'email':
      return requerido(texto) ?? correoValido(texto) ?? longitudMaxima(texto, 150);
    case 'password':
      return requerido(texto) ?? passwordSegura(texto);
    case 'role':
      return requerido(texto);
    case 'instituteId':
      return requerido(texto);
    case 'careerId':
      // Solo el ADMIN puede quedar sin carrera (contrato 5.2)
      return esAdmin.value ? null : requerido(texto);
  }
}

function validarTodo(): boolean {
  let valido = true;

  for (const campo of camposActivos.value) {
    const error = validarCampo(campo);
    errores[campo] = error;
    if (error) valido = false;
  }

  return valido;
}

watch(
  () => props.usuario,
  (usuario) => {
    valores.institutionalId = usuario?.institutionalId ?? '';
    valores.firstName = usuario?.firstName ?? '';
    valores.lastName = usuario?.lastName ?? '';
    valores.email = usuario?.email ?? '';
    valores.password = '';
    valores.role = usuario?.role ?? '';
    valores.instituteId = usuario?.instituteId ?? '';
    valores.careerId = usuario?.careerId ?? '';
    valores.isActive = usuario?.isActive ?? true;

    for (const campo of Object.keys(errores) as Campo[]) {
      errores[campo] = null;
    }
  },
  { immediate: true }
);

// Un ADMIN no lleva carrera
watch(
  () => valores.role,
  (rol) => {
    if (rol === UserRole.ADMIN) {
      valores.careerId = '';
      errores.careerId = null;
    }
  }
);

watch(
  () => valores.instituteId,
  () => {
    if (!esEdicion.value) {
      valores.careerId = '';
    }
  }
);

const erroresApi = computed(() =>
  props.errorApi ? obtenerErroresPorCampo(props.errorApi) : {}
);

function errorDe(campo: Campo): string | null {
  return errores[campo] ?? erroresApi.value[campo] ?? null;
}

function enviar() {
  if (!validarTodo()) return;

  const careerId = valores.careerId === '' ? null : Number(valores.careerId);

  if (esEdicion.value) {
    emit('guardar', {
      firstName: valores.firstName.trim(),
      lastName: valores.lastName.trim(),
      role: valores.role as UserRole,
      careerId,
      isActive: valores.isActive,
    });
    return;
  }

  emit('guardar', {
    institutionalId: valores.institutionalId.trim(),
    firstName: valores.firstName.trim(),
    lastName: valores.lastName.trim(),
    email: valores.email.trim(),
    password: valores.password,
    role: valores.role as UserRole,
    instituteId: Number(valores.instituteId),
    careerId,
  });
}
</script>

<template>
  <form
    class="formulario"
    novalidate
    @submit.prevent="enviar"
  >
    <h2 class="formulario-titulo">
      {{ usuario ? 'Editar usuario' : 'Nuevo usuario' }}
    </h2>

    <p
      v-if="mensajeError"
      class="formulario-error-general"
    >
      {{ mensajeError }}
    </p>

    <BaseInput
      id="usuario-institutionalId"
      v-model="valores.institutionalId"
      label="Identificador institucional"
      placeholder="Número de control o de tarjeta"
      required
      :disabled="esEdicion"
      :error="errorDe('institutionalId')"
    />

    <BaseInput
      id="usuario-firstName"
      v-model="valores.firstName"
      label="Nombre(s)"
      required
      :error="errorDe('firstName')"
    />

    <BaseInput
      id="usuario-lastName"
      v-model="valores.lastName"
      label="Apellidos"
      required
      :error="errorDe('lastName')"
    />

    <BaseInput
      id="usuario-email"
      v-model="valores.email"
      label="Correo institucional"
      type="email"
      required
      :disabled="esEdicion"
      :error="errorDe('email')"
    />

    <BaseInput
      v-if="!esEdicion"
      id="usuario-password"
      v-model="valores.password"
      label="Contraseña"
      type="password"
      required
      :error="errorDe('password')"
    />

    <BaseSelect
      id="usuario-role"
      v-model="valores.role"
      label="Rol"
      required
      :options="opcionesRoles"
      :error="errorDe('role')"
    />

    <BaseSelect
      id="usuario-instituteId"
      v-model="valores.instituteId"
      label="Instituto"
      required
      :options="institutos"
      :disabled="esEdicion"
      :error="errorDe('instituteId')"
    />

    <BaseSelect
      id="usuario-careerId"
      v-model="valores.careerId"
      label="Carrera"
      :required="!esAdmin"
      :disabled="esAdmin"
      :options="opcionesCarreras"
      :error="errorDe('careerId')"
    />

    <label
      v-if="esEdicion"
      class="formulario-activo"
    >
      <input
        v-model="valores.isActive"
        type="checkbox"
      >
      Cuenta activa
    </label>

    <div class="formulario-acciones">
      <button
        type="button"
        class="boton boton-secundario"
        :disabled="guardando"
        @click="emit('cancelar')"
      >
        Cancelar
      </button>

      <button
        type="submit"
        class="boton boton-primario"
        :disabled="guardando"
      >
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
}

.formulario-titulo {
  margin: 0;
  font-size: 1.25rem;
}

.formulario-error-general {
  margin: 0;
  padding: .75rem;
  border-radius: var(--radius-sm);
  background: #fee2e2;
  color: var(--color-danger);
}

.formulario-activo {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.formulario-acciones {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
}

.boton {
  padding: .6rem 1.1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.boton:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.boton-primario {
  background: var(--color-primary);
  color: #fff;
}

.boton-primario:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.boton-secundario {
  border-color: var(--color-border);
  background: #fff;
}
</style>