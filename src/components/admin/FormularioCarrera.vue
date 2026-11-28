<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import BaseSelect from '@/components/forms/BaseSelect.vue';
import { requerido, soloNumeros, longitudMaxima } from '@/utils/validaciones';
import { obtenerErroresPorCampo } from '@/utils/errores-api';
import type { Carrera, CarreraPayload } from '@/types/carreras';
import type { SelectOption } from '@/types/ui';

type Validador = (valor: string) => string | null;
type Campo =
  | 'instituteId'
  | 'curriculumCode'
  | 'name'
  | 'shortName'
  | 'totalSemesters';

const props = defineProps<{
  carrera?: Carrera | null;
  institutos: SelectOption[];
  guardando?: boolean;
  errorApi?: unknown;
  mensajeError?: string | null;
}>();

const emit = defineEmits<{
  guardar: [payload: CarreraPayload];
  cancelar: [];
}>();

const campos: Campo[] = [
  'instituteId',
  'curriculumCode',
  'name',
  'shortName',
  'totalSemesters',
];

const valores = reactive({
  instituteId: '' as string | number,
  curriculumCode: '',
  name: '',
  shortName: '',
  totalSemesters: '9',
  isActive: true,
});

const errores = reactive<Record<Campo, string | null>>({
  instituteId: null,
  curriculumCode: null,
  name: null,
  shortName: null,
  totalSemesters: null,
});

function semestresEnRango(valor: string): string | null {
  const numero = Number(valor);
  return numero >= 1 && numero <= 14
    ? null
    : 'Debe estar entre 1 y 14 semestres.';
}

const reglas: Record<Campo, Validador[]> = {
  instituteId: [requerido],
  curriculumCode: [requerido, (v) => longitudMaxima(v, 40)],
  name: [requerido, (v) => longitudMaxima(v, 180)],
  shortName: [requerido, (v) => longitudMaxima(v, 20)],
  totalSemesters: [requerido, soloNumeros, semestresEnRango],
};

watch(
  () => props.carrera,
  (carrera) => {
    valores.instituteId = carrera?.instituteId ?? '';
    valores.curriculumCode = carrera?.curriculumCode ?? '';
    valores.name = carrera?.name ?? '';
    valores.shortName = carrera?.shortName ?? '';
    valores.totalSemesters = String(carrera?.totalSemesters ?? 9);
    valores.isActive = carrera?.isActive ?? true;

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
    const error = validar(String(valores[campo]), reglas[campo]);
    errores[campo] = error;
    if (error) valido = false;
  }

  return valido;
}

const erroresApi = computed(() =>
  props.errorApi ? obtenerErroresPorCampo(props.errorApi) : {}
);

function errorDe(campo: Campo): string | null {
  return errores[campo] ?? erroresApi.value[campo] ?? null;
}

function enviar() {
  if (!validarTodo()) return;

  emit('guardar', {
    instituteId: Number(valores.instituteId),
    curriculumCode: valores.curriculumCode.trim(),
    name: valores.name.trim(),
    shortName: valores.shortName.trim(),
    totalSemesters: Number(valores.totalSemesters),
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
      {{ carrera ? 'Editar carrera' : 'Nueva carrera' }}
    </h2>

    <p
      v-if="mensajeError"
      class="formulario-error-general"
    >
      {{ mensajeError }}
    </p>

    <BaseSelect
      id="carrera-instituteId"
      v-model="valores.instituteId"
      label="Instituto"
      required
      :options="institutos"
      :error="errorDe('instituteId')"
    />

    <BaseInput
      id="carrera-curriculumCode"
      v-model="valores.curriculumCode"
      label="Clave del plan de estudios"
      placeholder="ISIC-2010-224"
      required
      :error="errorDe('curriculumCode')"
    />

    <BaseInput
      id="carrera-name"
      v-model="valores.name"
      label="Nombre"
      required
      :error="errorDe('name')"
    />

    <BaseInput
      id="carrera-shortName"
      v-model="valores.shortName"
      label="Siglas"
      required
      :error="errorDe('shortName')"
    />

    <BaseInput
      id="carrera-totalSemesters"
      v-model="valores.totalSemesters"
      label="Total de semestres (1 a 14)"
      required
      :error="errorDe('totalSemesters')"
    />

    <label class="formulario-activo">
      <input
        v-model="valores.isActive"
        type="checkbox"
      >
      Activa
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