<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { isAxiosError } from 'axios';
import DataTable from '@/components/ui/DataTable.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { rolesService } from '@/services/roles.service';
import type { Rol } from '@/types/rol';
import type { TableColumn } from '@/types/ui';

const columnas: TableColumn[] = [
  { key: 'name', label: 'Rol' },
  { key: 'description', label: 'Descripción' },
  { key: 'createdAt', label: 'Creado' },
];

// Lista
const roles = ref<Rol[]>([]);
const cargando = ref(false);
const errorCarga = ref<string | null>(null);

// Detalle
const rolSeleccionado = ref<Rol | null>(null);
const cargandoDetalle = ref(false);
const errorDetalle = ref<string | null>(null);

function obtenerMensaje(err: unknown, porDefecto: string): string {
  if (isAxiosError(err)) {
    return err.response?.data?.message ?? porDefecto;
  }
  return porDefecto;
}

function formatearFecha(valor: unknown): string {
  const fecha = new Date(String(valor));

  return Number.isNaN(fecha.getTime())
    ? '—'
    : fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}

async function cargar() {
  cargando.value = true;
  errorCarga.value = null;

  try {
    const { data } = await rolesService.listar();
    roles.value = data.data;
  } catch (err) {
    errorCarga.value = obtenerMensaje(err, 'No se pudieron cargar los roles.');
  } finally {
    cargando.value = false;
  }
}

async function verDetalle(fila: Record<string, unknown>) {
  cargandoDetalle.value = true;
  errorDetalle.value = null;
  rolSeleccionado.value = null;

  try {
    const { data } = await rolesService.obtener(Number(fila.id));
    rolSeleccionado.value = data.data;
  } catch (err) {
    errorDetalle.value = obtenerMensaje(err, 'No se pudo cargar el detalle del rol.');
  } finally {
    cargandoDetalle.value = false;
  }
}

function cerrarDetalle() {
  rolSeleccionado.value = null;
  errorDetalle.value = null;
}

onMounted(cargar);
</script>

<template>
  <section class="vista">
    <header class="vista-encabezado">
      <h1 class="vista-titulo">
        Roles
      </h1>
    </header>

    <p class="vista-nota">
      Los roles forman un catálogo cerrado del sistema: solo se consultan.
    </p>

    <ErrorState
      v-if="errorCarga"
      :message="errorCarga"
    />

    <DataTable
      v-else
      :columns="columnas"
      :rows="roles"
      :loading="cargando"
      empty-message="No hay roles registrados."
    >
      <template #cell-createdAt="{ value }">
        {{ formatearFecha(value) }}
      </template>

      <template #actions="{ row }">
        <button
          type="button"
          class="boton-fila"
          @click="verDetalle(row)"
        >
          Ver detalle
        </button>
      </template>
    </DataTable>

    <LoadingState v-if="cargandoDetalle" />

    <ErrorState
      v-if="errorDetalle"
      :message="errorDetalle"
    />

    <article
      v-if="rolSeleccionado"
      class="detalle"
    >
      <h2 class="detalle-titulo">
        {{ rolSeleccionado.name }}
      </h2>

      <p class="detalle-texto">
        {{ rolSeleccionado.description }}
      </p>

      <p class="detalle-meta">
        Creado el {{ formatearFecha(rolSeleccionado.createdAt) }}
      </p>

      <button
        type="button"
        class="boton-fila"
        @click="cerrarDetalle"
      >
        Cerrar
      </button>
    </article>
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

.vista-titulo {
  margin: 0;
  font-size: 1.5rem;
}

.vista-nota {
  margin: 0;
  color: var(--color-text-secondary);
}

.boton-fila {
  padding: .35rem .75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
  cursor: pointer;
}

.detalle {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: .5rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
}

.detalle-titulo {
  margin: 0;
  font-size: 1.25rem;
}

.detalle-texto {
  margin: 0;
}

.detalle-meta {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: .875rem;
}
</style>