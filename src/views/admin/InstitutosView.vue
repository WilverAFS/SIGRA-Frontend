<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import Tabla from '@/components/ui/DataTable.vue';
import Paginacion from '@/components/ui/PaginationBar.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import FormularioInstituto from '@/components/admin/FormularioInstituto.vue';
import { institutosService } from '@/services/institutos.service';
import type { Instituto, InstitutoPayload } from '@/types/institutos';
import type { TableColumn } from '@/types/ui';

const POR_PAGINA = 10;

const columnas: TableColumn[] = [
  { key: 'code', label: 'Código' },
  { key: 'name', label: 'Nombre' },
  { key: 'shortName', label: 'Siglas' },
  { key: 'city', label: 'Ciudad' },
  { key: 'state', label: 'Estado' },
  { key: 'isActive', label: 'Activo' },
];

// Lista
const institutos = ref<Instituto[]>([]);
const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const pagina = ref(1);
const totalPaginas = ref(1);

// Formulario
const mostrarFormulario = ref(false);
const institutoEditando = ref<Instituto | null>(null);
const guardando = ref(false);
const errorGuardado = ref<unknown>(null);
const mensajeErrorGuardado = ref<string | null>(null);

// Eliminar
const modalEliminarAbierto = ref(false);
const institutoAEliminar = ref<Instituto | null>(null);
const eliminando = ref(false);

// Mensajes
const mensajeExito = ref<string | null>(null);
const mensajeError = ref<string | null>(null);

const mensajeEliminar = computed(() =>
  institutoAEliminar.value
    ? `¿Eliminar el instituto «${institutoAEliminar.value.name}»? Esta acción no se puede deshacer.`
    : ''
);

function obtenerMensaje(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? porDefecto;
  }
  return porDefecto;
}

async function cargar() {
  cargando.value = true;
  errorCarga.value = null;

  try {
    const { data } = await institutosService.listar({
      page: pagina.value,
      limit: POR_PAGINA,
    });

    institutos.value = data.data;
    totalPaginas.value = data.meta?.totalPages ?? 1;
  } catch (err) {
    errorCarga.value = obtenerMensaje(err, 'No se pudieron cargar los institutos.');
  } finally {
    cargando.value = false;
  }
}

function limpiarMensajes() {
  mensajeExito.value = null;
  mensajeError.value = null;
}

function abrirNuevo() {
  limpiarMensajes();
  institutoEditando.value = null;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function abrirEdicion(fila: Record<string, unknown>) {
  limpiarMensajes();
  institutoEditando.value = fila as unknown as Instituto;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  institutoEditando.value = null;
}

async function guardar(payload: InstitutoPayload) {
  guardando.value = true;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;

  try {
        if (institutoEditando.value) {
      const original = institutoEditando.value;
      const cambios: Partial<InstitutoPayload> = {};

      for (const clave of Object.keys(payload) as (keyof InstitutoPayload)[]) {
        if (payload[clave] !== original[clave]) {
          (cambios as Record<string, unknown>)[clave] = payload[clave];
        }
      }

      if (Object.keys(cambios).length > 0) {
        await institutosService.actualizar(original.id, cambios);
      }

      mensajeExito.value = 'Instituto actualizado correctamente.';
    } else {
      await institutosService.crear(payload);
      mensajeExito.value = 'Instituto creado correctamente.';
    }

    cerrarFormulario();
    await cargar();
  } catch (err) {
    errorGuardado.value = err;

    // Los 422 se muestran junto a cada campo; el resto, como mensaje general
    if (!isAxiosError(err) || err.response?.status !== 422) {
      mensajeErrorGuardado.value = obtenerMensaje(err, 'No se pudo guardar el instituto.');
    }
  } finally {
    guardando.value = false;
  }
}

function pedirEliminar(fila: Record<string, unknown>) {
  limpiarMensajes();
  institutoAEliminar.value = fila as unknown as Instituto;
  modalEliminarAbierto.value = true;
}

async function confirmarEliminar() {
  if (!institutoAEliminar.value) return;

  eliminando.value = true;

  try {
    await institutosService.eliminar(institutoAEliminar.value.id);
    modalEliminarAbierto.value = false;
    mensajeExito.value = 'Instituto eliminado correctamente.';

    if (institutos.value.length === 1 && pagina.value > 1) {
      pagina.value -= 1; // el watch recarga la lista
    } else {
      await cargar();
    }
  } catch (err) {
    modalEliminarAbierto.value = false;

    mensajeError.value =
      isAxiosError(err) && err.response?.status === 409
        ? 'No se puede eliminar: el instituto tiene carreras o usuarios asociados.'
        : obtenerMensaje(err, 'No se pudo eliminar el instituto.');
  } finally {
    eliminando.value = false;
    institutoAEliminar.value = null;
  }
}

watch(pagina, cargar);
onMounted(cargar);
</script>

<template>
  <section class="vista">
    <header class="vista-encabezado">
      <h1 class="vista-titulo">
        Institutos
      </h1>

      <button
        v-if="!mostrarFormulario"
        type="button"
        class="boton-nuevo"
        @click="abrirNuevo"
      >
        Nuevo instituto
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

    <FormularioInstituto
      v-if="mostrarFormulario"
      :instituto="institutoEditando"
      :guardando="guardando"
      :error-api="errorGuardado"
      :mensaje-error="mensajeErrorGuardado"
      @guardar="guardar"
      @cancelar="cerrarFormulario"
    />

    <ErrorState
      v-if="errorCarga"
      :message="errorCarga"
    />

    <template v-else>
      <Tabla
        :columns="columnas"
        :rows="institutos"
        :loading="cargando"
        empty-message="No hay institutos registrados."
      >
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
      </Tabla>

      <Paginacion
        v-if="totalPaginas > 1"
        v-model:page="pagina"
        :total-pages="totalPaginas"
      />
    </template>

    <ConfirmModal
      v-model="modalEliminarAbierto"
      title="Eliminar instituto"
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