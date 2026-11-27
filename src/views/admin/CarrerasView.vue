<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import DataTable from '@/components/ui/DataTable.vue';
import PaginationBar from '@/components/ui/PaginationBar.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import BaseSelect from '@/components/forms/BaseSelect.vue';
import FormularioCarrera from '@/components/admin/FormularioCarrera.vue';
import { carrerasService } from '@/services/carreras.service';
import { institutosService } from '@/services/institutos.service';
import { obtenerCodigoError } from '@/utils/errores-api';
import type { Carrera, CarreraPayload } from '@/types/carreras';
import type { Instituto } from '@/types/institutos';
import type { SelectOption, TableColumn } from '@/types/ui';

const POR_PAGINA = 10;

const columnas: TableColumn[] = [
  { key: 'curriculumCode', label: 'Clave del plan' },
  { key: 'name', label: 'Nombre' },
  { key: 'shortName', label: 'Siglas' },
  { key: 'instituteId', label: 'Instituto' },
  { key: 'totalSemesters', label: 'Semestres' },
  { key: 'isActive', label: 'Activa' },
];

// Lista
const carreras = ref<Carrera[]>([]);
const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const pagina = ref(1);
const totalPaginas = ref(1);

// Institutos (selector, filtro y nombres de la tabl)
const institutos = ref<Instituto[]>([]);

const opcionesInstitutos = computed<SelectOption[]>(() =>
  institutos.value.map((instituto) => ({
    value: instituto.id,
    label: instituto.name,
  }))
);

const nombresInstitutos = computed(
  () => new Map(institutos.value.map((instituto) => [instituto.id, instituto.name]))
);

function nombreInstituto(id: unknown): string {
  return nombresInstitutos.value.get(Number(id)) ?? `Instituto ${id}`;
}

// Filtros
const busqueda = ref('');
const filtroInstituto = ref<string | number>('');

// Formulario
const mostrarFormulario = ref(false);
const carreraEditando = ref<Carrera | null>(null);
const guardando = ref(false);
const errorGuardado = ref<unknown>(null);
const mensajeErrorGuardado = ref<string | null>(null);

// Eliminar
const modalEliminarAbierto = ref(false);
const carreraAEliminar = ref<Carrera | null>(null);
const eliminando = ref(false);

// Mensajes
const mensajeExito = ref<string | null>(null);
const mensajeError = ref<string | null>(null);

const mensajeEliminar = computed(() =>
  carreraAEliminar.value
    ? `¿Eliminar la carrera «${carreraAEliminar.value.name}»? Esta acción no se puede deshacer.`
    : ''
);

function obtenerMensaje(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? porDefecto;
  }
  return porDefecto;
}

function limpiarMensajes() {
  mensajeExito.value = null;
  mensajeError.value = null;
}

async function cargarInstitutos() {
  try {
    const { data } = await institutosService.listar({ page: 1, limit: 100 });
    institutos.value = data.data;
  } catch {
    institutos.value = [];
  }
}

async function cargar() {
  cargando.value = true;
  errorCarga.value = null;

  try {
    const { data } = await carrerasService.listar({
      page: pagina.value,
      limit: POR_PAGINA,
      search: busqueda.value.trim() || undefined,
      instituteId:
        filtroInstituto.value === '' ? undefined : Number(filtroInstituto.value),
    });

    carreras.value = data.data;
    totalPaginas.value = data.meta?.totalPages ?? 1;
  } catch (err) {
    errorCarga.value = obtenerMensaje(err, 'No se pudieron cargar las carreras.');
  } finally {
    cargando.value = false;
  }
}

function aplicarFiltros() {
  limpiarMensajes();

  if (pagina.value !== 1) {
    pagina.value = 1; 
  } else {
    cargar();
  }
}

function limpiarFiltros() {
  busqueda.value = '';
  filtroInstituto.value = '';
  aplicarFiltros();
}

function abrirNuevo() {
  limpiarMensajes();
  carreraEditando.value = null;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function abrirEdicion(fila: Record<string, unknown>) {
  limpiarMensajes();
  carreraEditando.value = fila as unknown as Carrera;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  carreraEditando.value = null;
}

async function guardar(payload: CarreraPayload) {
  guardando.value = true;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;

  try {
    if (carreraEditando.value) {
      const original = carreraEditando.value;
      const cambios: Partial<CarreraPayload> = {};

      for (const clave of Object.keys(payload) as (keyof CarreraPayload)[]) {
        if (payload[clave] !== original[clave]) {
          (cambios as Record<string, unknown>)[clave] = payload[clave];
        }
      }

      if (Object.keys(cambios).length > 0) {
        await carrerasService.actualizar(original.id, cambios);
      }

      mensajeExito.value = 'Carrera actualizada correctamente.';
    } else {
      await carrerasService.crear(payload);
      mensajeExito.value = 'Carrera creada correctamente.';
    }

    cerrarFormulario();
    await cargar();
  } catch (err) {
    errorGuardado.value = err;

    
    if (!isAxiosError(err) || err.response?.status !== 422) {
      mensajeErrorGuardado.value = obtenerMensaje(err, 'No se pudo guardar la carrera.');
    }
  } finally {
    guardando.value = false;
  }
}

function pedirEliminar(fila: Record<string, unknown>) {
  limpiarMensajes();
  carreraAEliminar.value = fila as unknown as Carrera;
  modalEliminarAbierto.value = true;
}

async function confirmarEliminar() {
  if (!carreraAEliminar.value) return;

  eliminando.value = true;

  try {
    await carrerasService.eliminar(carreraAEliminar.value.id);
    modalEliminarAbierto.value = false;
    mensajeExito.value = 'Carrera eliminada correctamente.';

    if (carreras.value.length === 1 && pagina.value > 1) {
      pagina.value -= 1; 
    } else {
      await cargar();
    }
  } catch (err) {
    modalEliminarAbierto.value = false;

    mensajeError.value =
      obtenerCodigoError(err) === 'RESOURCE_HAS_DEPENDENCIES'
        ? 'No se puede eliminar: la carrera tiene materias asociadas. Puedes desactivarla en su lugar.'
        : obtenerMensaje(err, 'No se pudo eliminar la carrera.');
  } finally {
    eliminando.value = false;
    carreraAEliminar.value = null;
  }
}

watch(pagina, cargar);

onMounted(() => {
  cargarInstitutos();
  cargar();
});
</script>

<template>
  <section class="vista">
    <header class="vista-encabezado">
      <h1 class="vista-titulo">
        Carreras
      </h1>

      <button
        v-if="!mostrarFormulario"
        type="button"
        class="boton-nuevo"
        @click="abrirNuevo"
      >
        Nueva carrera
      </button>
    </header>

    <p
      v-if="mensajeExito"
      class="aviso aviso-exito"
      role="status"
    >
      {{ mensajeExito }}
    </p>

    <p
      v-if="mensajeError"
      class="aviso aviso-error"
      role="alert"
    >
      {{ mensajeError }}
    </p>

    <FormularioCarrera
      v-if="mostrarFormulario"
      :carrera="carreraEditando"
      :institutos="opcionesInstitutos"
      :guardando="guardando"
      :error-api="errorGuardado"
      :mensaje-error="mensajeErrorGuardado"
      @guardar="guardar"
      @cancelar="cerrarFormulario"
    />

    <form
      v-if="!mostrarFormulario"
      class="filtros"
      @submit.prevent="aplicarFiltros"
    >
      <BaseInput
        id="filtro-busqueda"
        v-model="busqueda"
        label="Buscar"
        placeholder="Nombre o siglas"
      />

      <BaseSelect
        id="filtro-instituto"
        v-model="filtroInstituto"
        label="Instituto"
        placeholder="Todos"
        :options="opcionesInstitutos"
      />

      <div class="filtros-acciones">
        <button
          type="submit"
          class="boton-nuevo"
        >
          Buscar
        </button>

        <button
          type="button"
          class="boton-fila"
          @click="limpiarFiltros"
        >
          Limpiar
        </button>
      </div>
    </form>

    <ErrorState
      v-if="errorCarga"
      :message="errorCarga"
    />

    <template v-else>
      <DataTable
        :columns="columnas"
        :rows="carreras"
        :loading="cargando"
        empty-message="No hay carreras registradas."
      >
        <template #cell-instituteId="{ value }">
          {{ nombreInstituto(value) }}
        </template>

        <template #cell-isActive="{ value }">
          {{ value ? 'Sí' : 'No' }}
        </template>

        <template #actions="{ row }">
          <button
            type="button"
            class="boton-fila"
            @click="abrirEdicion(row)"
          >
            Editar
          </button>

          <button
            type="button"
            class="boton-fila boton-fila-peligro"
            @click="pedirEliminar(row)"
          >
            Eliminar
          </button>
        </template>
      </DataTable>

      <PaginationBar
        v-if="totalPaginas > 1"
        v-model:page="pagina"
        :total-pages="totalPaginas"
      />
    </template>

    <ConfirmModal
      v-model="modalEliminarAbierto"
      title="Eliminar carrera"
      :message="mensajeEliminar"
      confirm-text="Eliminar"
      :loading="eliminando"
      @confirm="confirmarEliminar"
    />
  </section>
</template>

<style scoped>
.vista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.vista-encabezado {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.vista-titulo {
  margin: 0;
  font-size: 1.5rem;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.filtros-acciones {
  display: flex;
  gap: .5rem;
}

.boton-nuevo {
  padding: .6rem 1.1rem;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
}

.boton-nuevo:hover {
  background: var(--color-primary-hover);
}

.aviso {
  margin: 0;
  padding: .75rem 1rem;
  border-radius: var(--radius-sm);
}

.aviso-exito {
  background: #dcfce7;
  color: #166534;
}

.aviso-error {
  background: #fee2e2;
  color: var(--color-danger);
}

.boton-fila {
  padding: .35rem .75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
}

.boton-fila-peligro {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>