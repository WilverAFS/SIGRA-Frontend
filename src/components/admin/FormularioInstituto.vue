<script setup lang="ts">
import { reactive, watch } from 'vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import { requerido, soloLetras, longitudMaxima } from '@/utils/validaciones';
import { getFieldError } from '@/utils/error-handler';
import type { Instituto, InstitutoPayload } from '@/types/institutos';

type Validador = (valor: string) => string | null;
type Campo = 'code' | 'name' | 'shortName' | 'city' | 'state';

const props = defineProps<{
  instituto?: Instituto | null;
  guardando?: boolean;
  errorApi?: unknown;
  mensajeError?: string | null;
}>();

const emit = defineEmits<{
  guardar: [payload: InstitutoPayload];
  cancelar: [];
}>();

const campos: Campo[] = ['code', 'name', 'shortName', 'city', 'state'];

const valores = reactive({
  code: '',
  name: '',
  shortName: '',
  city: '',
  state: '',
  isActive: true,
});

const errores = reactive<Record<Campo, string | null>>({
  code: null,
  name: null,
  shortName: null,
  city: null,
  state: null,
});

const reglas: Record<Campo, Validador[]> = {
  code: [requerido, (v) => longitudMaxima(v, 30)],
  name: [requerido, (v) => longitudMaxima(v, 180)],
  shortName: [requerido, (v) => longitudMaxima(v, 30)],
  city: [requerido, soloLetras, (v) => longitudMaxima(v, 100)],
  state: [requerido, soloLetras, (v) => longitudMaxima(v, 100)],
};

watch(
  () => props.instituto,
  (instituto) => {
    valores.code = instituto?.code ?? '';
    valores.name = instituto?.name ?? '';
    valores.shortName = instituto?.shortName ?? '';
    valores.city = instituto?.city ?? '';
    valores.state = instituto?.state ?? '';
    valores.isActive = instituto?.isActive ?? true;

    for (const campo of campos) {
      errores[campo] = null;
    }
  },
  { immediate: true }
);

function validar(valor: string, validadores: Validador[]): string | null {
  for (const validador of validadores) {
    const error = validador(valor);
    if (error) return error;
  }
  return null;
}

function validarTodo(): boolean {
  let valido = true;

  for (const campo of campos) {
    const error = validar(valores[campo], reglas[campo]);
    errores[campo] = error;
    if (error) valido = false;
  }

  return valido;
}

function errorDe(campo: Campo): string | null {
  return errores[campo] ?? (props.errorApi ? getFieldError(props.errorApi, campo) : null);
}

function enviar() {
  if (!validarTodo()) return;

  emit('guardar', {
    code: valores.code.trim(),
    name: valores.name.trim(),
    shortName: valores.shortName.trim(),
    city: valores.city.trim(),
    state: valores.state.trim(),
    isActive: valores.isActive,
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
      {{ instituto ? 'Editar instituto' : 'Nuevo instituto' }}
    </h2>

    <p
      v-if="mensajeError"
      class="formulario-error-general"
    >
      {{ mensajeError }}
    </p>

    <BaseInput
      id="instituto-code"
      v-model="valores.code"
      label="Código"
      required
      :error="errorDe('code')"
    />

    <BaseInput
      id="instituto-name"
      v-model="valores.name"
      label="Nombre"
      required
      :error="errorDe('name')"
    />

    <BaseInput
      id="instituto-shortName"
      v-model="valores.shortName"
      label="Siglas"
      required
      :error="errorDe('shortName')"
    />

    <BaseInput
      id="instituto-city"
      v-model="valores.city"
      label="Ciudad"
      required
      :error="errorDe('city')"
    />

    <BaseInput
      id="instituto-state"
      v-model="valores.state"
      label="Estado"
      required
      :error="errorDe('state')"
    />

    <label class="formulario-activo">
      <input
        v-model="valores.isActive"
        type="checkbox"
      >
      Activo
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