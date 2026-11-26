<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { isAxiosError } from 'axios';
import DataTable from '@/components/ui/DataTable.vue';
import PaginationBar from '@/components/ui/PaginationBar.vue';
import ConfirmModal from '@/components/ui/ConfirmModal.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import BaseInput from '@/components/forms/BaseInput.vue';
import BaseSelect from '@/components/forms/BaseSelect.vue';
import FormularioUsuario from '@/components/admin/FormularioUsuario.vue';
import { usuariosService } from '@/services/usuarios.service';
import { institutosService } from '@/services/institutos.service';
import { carrerasService } from '@/services/carreras.service';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@/types/roles';
import type { Usuario, UsuarioCambios, UsuarioNuevo } from '@/types/usuarios';
import type { Instituto } from '@/types/institutos';
import type { Carrera } from '@/types/carreras';
import type { SelectOption, TableColumn } from '@/types/ui';

const POR_PAGINA = 10;

const authStore = useAuthStore();

const columnas: TableColumn[] = [
  { key: 'institutionalId', label: 'Identificador' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'email', label: 'Correo' },
  { key: 'role', label: 'Rol' },
  { key: 'instituteId', label: 'Instituto' },
  { key: 'isActive', label: 'Estado' },
];

const etiquetasRoles: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
};

const opcionesRoles: SelectOption[] = Object.values(UserRole).map((rol) => ({
  value: rol,
  label: etiquetasRoles[rol] ?? rol,
}));

const opcionesEstado: SelectOption[] = [
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos o pendientes' },
];

function etiquetaRol(valor: unknown): string {
  return etiquetasRoles[String(valor)] ?? String(valor);
}

// Lista
const usuarios = ref<Usuario[]>([]);
const cargando = ref(false);
const errorCarga = ref<string | null>(null);
const pagina = ref(1);
const totalPaginas = ref(1);

// Institutos y carreras (filtros, formulario y nombres de la tabla)
const institutos = ref<Instituto[]>([]);
const carreras = ref<Carrera[]>([]);

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
const filtroRol = ref<string | number>('');
const filtroInstituto = ref<string | number>('');
const filtroEstado = ref<string | number>('');

// Formulario
const mostrarFormulario = ref(false);
const usuarioEditando = ref<Usuario | null>(null);
const guardando = ref(false);
const errorGuardado = ref<unknown>(null);
const mensajeErrorGuardado = ref<string | null>(null);

// Eliminar
const modalEliminarAbierto = ref(false);
const usuarioAEliminar = ref<Usuario | null>(null);
const eliminando = ref(false);

// Mensajes
const mensajeExito = ref<string | null>(null);
const mensajeError = ref<string | null>(null);

const mensajeEliminar = computed(() =>
  usuarioAEliminar.value
    ? `¿Eliminar al usuario «${usuarioAEliminar.value.firstName} ${usuarioAEliminar.value.lastName}»? Dejará de aparecer en los listados y no podrá iniciar sesión.`
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

function esMiCuenta(fila: Record<string, unknown>): boolean {
  return Number(fila.id) === authStore.user?.id;
}

async function cargarCatalogos() {
  try {
    const [respuestaInstitutos, respuestaCarreras] = await Promise.all([
      institutosService.listar({ page: 1, limit: 100 }),
      carrerasService.listar({ page: 1, limit: 100 }),
    ]);

    institutos.value = respuestaInstitutos.data.data;
    carreras.value = respuestaCarreras.data.data;
  } catch {
    institutos.value = [];
    carreras.value = [];
  }
}

async function cargar() {
  cargando.value = true;
  errorCarga.value = null;

  try {
    const { data } = await usuariosService.listar({
      page: pagina.value,
      limit: POR_PAGINA,
      search: busqueda.value.trim() || undefined,
      role: filtroRol.value === '' ? undefined : String(filtroRol.value),
      instituteId:
        filtroInstituto.value === '' ? undefined : Number(filtroInstituto.value),
      isActive:
        filtroEstado.value === '' ? undefined : filtroEstado.value === 'true',
    });

    usuarios.value = data.data;
    totalPaginas.value = data.meta?.totalPages ?? 1;
  } catch (err) {
    errorCarga.value = obtenerMensaje(err, 'No se pudieron cargar los usuarios.');
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
  filtroRol.value = '';
  filtroInstituto.value = '';
  filtroEstado.value = '';
  aplicarFiltros();
}

function verPendientes() {
  busqueda.value = '';
  filtroInstituto.value = '';
  filtroRol.value = UserRole.DOCENTE;
  filtroEstado.value = 'false';
  aplicarFiltros();
}

function abrirNuevo() {
  limpiarMensajes();
  usuarioEditando.value = null;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function abrirEdicion(fila: Record<string, unknown>) {
  limpiarMensajes();
  usuarioEditando.value = fila as unknown as Usuario;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;
  mostrarFormulario.value = true;
}

function cerrarFormulario() {
  mostrarFormulario.value = false;
  usuarioEditando.value = null;
}

async function guardar(payload: UsuarioNuevo | UsuarioCambios) {
  guardando.value = true;
  errorGuardado.value = null;
  mensajeErrorGuardado.value = null;

  try {
    if (usuarioEditando.value) {
      const original = usuarioEditando.value as Record<string, unknown>;
      const cambios: Record<string, unknown> = {};

      for (const [clave, valor] of Object.entries(payload)) {
        if (valor !== original[clave]) {
          cambios[clave] = valor;
        }
      }

      if (Object.keys(cambios).length > 0) {
        await usuariosService.actualizar(
          usuarioEditando.value.id,
          cambios as Partial<UsuarioCambios>
        );
      }

      mensajeExito.value = 'Usuario actualizado correctamente.';
    } else {
      await usuariosService.crear(payload as UsuarioNuevo);
      mensajeExito.value = 'Usuario creado correctamente.';
    }

    cerrarFormulario();
    await cargar();
  } catch (err) {
    errorGuardado.value = err;


    if (!isAxiosError(err) || err.response?.status !== 422) {
      mensajeErrorGuardado.value = obtenerMensaje(err, 'No se pudo guardar el usuario.');
    }
  } finally {
    guardando.value = false;
  }
}

async function activar(fila: Record<string, unknown>) {
  limpiarMensajes();

  try {
    await usuariosService.actualizar(Number(fila.id), { isActive: true });
    mensajeExito.value = 'Cuenta activada correctamente.';
    await cargar();
  } catch (err) {
    mensajeError.value = obtenerMensaje(err, 'No se pudo activar la cuenta.');
  }
}

function pedirEliminar(fila: Record<string, unknown>) {
  limpiarMensajes();
  usuarioAEliminar.value = fila as unknown as Usuario;
  modalEliminarAbierto.value = true;
}

async function confirmarEliminar() {
  if (!usuarioAEliminar.value) return;

  eliminando.value = true;

  try {
    await usuariosService.eliminar(usuarioAEliminar.value.id);
    modalEliminarAbierto.value = false;
    mensajeExito.value = 'Usuario eliminado correctamente.';

    if (usuarios.value.length === 1 && pagina.value > 1) {
      pagina.value -= 1; 
    } else {
      await cargar();
    }
  } catch (err) {
    modalEliminarAbierto.value = false;
    mensajeError.value = obtenerMensaje(err, 'No se pudo eliminar el usuario.');
  } finally {
    eliminando.value = false;
    usuarioAEliminar.value = null;
  }
}

watch(pagina, cargar);

onMounted(() => {
  cargarCatalogos();
  cargar();
});
</script>

<template>
  <section class="vista">
    <header class="vista-encabezado">
      <h1 class="vista-titulo">
        Usuarios
      </h1>

      <button
        v-if="!mostrarFormulario"
        type="button"
        class="boton-nuevo"
        @click="abrirNuevo"
      >
        Nuevo usuario
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

    <FormularioUsuario
      v-if="mostrarFormulario"
      :usuario="usuarioEditando"
      :institutos="opcionesInstitutos"
      :carreras="carreras"
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
        placeholder="Nombre, correo o identificador"
      />

      <BaseSelect
        id="filtro-rol"
        v-model="filtroRol"
        label="Rol"
        placeholder="Todos"
        :options="opcionesRoles"
      />

      <BaseSelect
        id="filtro-instituto"
        v-model="filtroInstituto"
        label="Instituto"
        placeholder="Todos"
        :options="opcionesInstitutos"
      />

      <BaseSelect
        id="filtro-estado"
        v-model="filtroEstado"
        label="Estado"
        placeholder="Todos"
        :options="opcionesEstado"
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
          @click="verPendientes"
        >
          Docentes pendientes
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
        :rows="usuarios"
        :loading="cargando"
        empty-message="No hay usuarios que coincidan."
      >
        <template #cell-nombre="{ row }">
          {{ row.firstName }} {{ row.lastName }}
        </template>

        <template #cell-role="{ value }">
          {{ etiquetaRol(value) }}
        </template>

        <template #cell-instituteId="{ value }">
          {{ nombreInstituto(value) }}
        </template>

        <template #cell-isActive="{ row }">
          {{ row.isActive ? 'Activo' : (row.role === 'DOCENTE' ? 'Pendiente de aprobación' : 'Inactivo') }}
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
            v-if="!row.isActive"
            type="button"
            class="boton-fila"
            @click="activar(row)"
          >
            Activar
          </button>

          <button
            v-if="!esMiCuenta(row)"
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
      title="Eliminar usuario"
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
  flex-wrap: wrap;
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