<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';
import { auditService } from '@/services/audit.service';
import type {
  AuditFilters,
  AuditLog,
  AuditLogPage,
} from '@/types/audit';

const logs = ref<AuditLog[]>([]);
const pagination = ref<AuditLogPage['meta'] | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const filters = reactive({
  userId: '',
  action: '',
  entityName: '',
  entityId: '',
  from: '',
  to: '',
});

const page = ref(1);
const limit = 20;

const selectedLog = ref<AuditLog | null>(null);
const detailLoading = ref(false);
const detailError = ref<string | null>(null);

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message
      ?? (err.request
        ? 'No fue posible comunicarse con el servidor. Comprueba tu conexión e inténtalo nuevamente.'
        : 'Ocurrió un error al realizar la consulta.');
  }

  return err instanceof Error
    ? err.message
    : 'Ocurrió un error inesperado.';
}

function toIsoDate(value: string): string | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildFilters(): AuditFilters {
  const result: AuditFilters = {
    page: page.value,
    limit,
  };

  if (filters.userId.trim()) {
    result.userId = Number(filters.userId);
  }

  if (filters.action.trim()) {
    result.action = filters.action.trim();
  }

  if (filters.entityName.trim()) {
    result.entityName = filters.entityName.trim();
  }

  if (filters.entityId.trim()) {
    result.entityId = Number(filters.entityId);
  }

  const from = toIsoDate(filters.from);
  const to = toIsoDate(filters.to);

  if (from) result.from = from;
  if (to) result.to = to;

  return result;
}

function validateFilters(): string | null {
  if (filters.userId && (!Number.isSafeInteger(Number(filters.userId)) || Number(filters.userId) <= 0)) {
    return 'El ID de usuario debe ser un número entero positivo.';
  }

  if (filters.entityId && (!Number.isSafeInteger(Number(filters.entityId)) || Number(filters.entityId) <= 0)) {
    return 'El ID de entidad debe ser un número entero positivo.';
  }

  if (filters.from && !toIsoDate(filters.from)) {
    return 'La fecha inicial no es válida.';
  }

  if (filters.to && !toIsoDate(filters.to)) {
    return 'La fecha final no es válida.';
  }

  if (filters.from && filters.to && new Date(filters.to) < new Date(filters.from)) {
    return 'La fecha final debe ser igual o posterior a la fecha inicial.';
  }

  return null;
}

async function loadLogs() {
  const validationError = validateFilters();

  if (validationError) {
    error.value = validationError;
    return;
  }

  loading.value = true;
  error.value = null;
  selectedLog.value = null;

  try {
    const result = await auditService.list(buildFilters());
    logs.value = result.data;
    pagination.value = result.meta;
  } catch (err: unknown) {
    console.error('Error al consultar auditoría:', err);
    error.value = getErrorMessage(err);
    logs.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  loadLogs();
}

function clearFilters() {
  filters.userId = '';
  filters.action = '';
  filters.entityName = '';
  filters.entityId = '';
  filters.from = '';
  filters.to = '';
  page.value = 1;
  loadLogs();
}

async function changePage(nextPage: number) {
  if (
    !pagination.value
    || nextPage < 1
    || nextPage > pagination.value.totalPages
    || nextPage === page.value
  ) {
    return;
  }

  page.value = nextPage;
  await loadLogs();
}

async function openDetail(id: number) {
  detailLoading.value = true;
  detailError.value = null;
  selectedLog.value = null;

  try {
    selectedLog.value = await auditService.getById(id);
  } catch (err: unknown) {
    console.error('Error al consultar detalle de auditoría:', err);
    detailError.value = getErrorMessage(err);
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  if (detailLoading.value) return;

  selectedLog.value = null;
  detailError.value = null;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

function formatMetadata(value: unknown): string {
  if (value === null || value === undefined) return 'Sin metadatos';

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'No fue posible mostrar los metadatos.';
  }
}

onMounted(loadLogs);
</script>

<template>
  <div class="audit-page">
    <header class="audit-header">
      <div>
        <p class="eyebrow">SIGRA / ADMINISTRACIÓN</p>
        <h1>Auditoría del sistema</h1>
        <p class="description">
          Consulta las acciones registradas y revisa el detalle de cada evento.
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="loading"
        @click="loadLogs"
      >
        {{ loading ? 'Consultando...' : 'Actualizar' }}
      </button>
    </header>

    <section class="filters-card" aria-labelledby="filters-title">
      <div class="section-heading">
        <div>
          <h2 id="filters-title">Filtros de búsqueda</h2>
          <p>Los campos vacíos no se incluyen en la consulta.</p>
        </div>
      </div>

      <form class="filters-grid" @submit.prevent="applyFilters">
        <label>
          ID de usuario
          <input
            v-model="filters.userId"
            type="number"
            min="1"
            placeholder="Ej. 12"
          >
        </label>

        <label>
          Acción
          <input
            v-model="filters.action"
            type="text"
            maxlength="60"
            placeholder="Ej. CREATE"
          >
        </label>

        <label>
          Nombre de entidad
          <input
            v-model="filters.entityName"
            type="text"
            maxlength="60"
            placeholder="Ej. Material"
          >
        </label>

        <label>
          ID de entidad
          <input
            v-model="filters.entityId"
            type="number"
            min="1"
            placeholder="Ej. 25"
          >
        </label>

        <label>
          Desde
          <input v-model="filters.from" type="datetime-local">
        </label>

        <label>
          Hasta
          <input v-model="filters.to" type="datetime-local">
        </label>

        <div class="filter-actions">
          <button class="primary-button" type="submit" :disabled="loading">
            Aplicar filtros
          </button>
          <button class="secondary-button" type="button" :disabled="loading" @click="clearFilters">
            Limpiar
          </button>
        </div>
      </form>
    </section>

    <section class="results-section" aria-labelledby="results-title">
      <div class="section-heading">
        <div>
          <h2 id="results-title">Registros de auditoría</h2>
          <p v-if="pagination">
            {{ pagination.total }} registros encontrados
          </p>
        </div>
        <span v-if="pagination" class="count-badge">
          Página {{ pagination.page }} de {{ Math.max(pagination.totalPages, 1) }}
        </span>
      </div>

      <div v-if="loading" class="feedback-card" role="status" aria-live="polite">
        <span class="loading-indicator" aria-hidden="true"></span>
        <span>Consultando registros de auditoría...</span>
      </div>

      <div v-else-if="error" class="feedback-card error-card" role="alert">
        <div>
          <h3>No fue posible consultar la auditoría</h3>
          <p>{{ error }}</p>
          <button class="retry-button" type="button" @click="loadLogs">
            Reintentar
          </button>
        </div>
      </div>

      <div v-else-if="logs.length === 0" class="empty-state" role="status">
        No se encontraron registros de auditoría con los criterios seleccionados.
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Usuario</th>
              <th scope="col">Acción</th>
              <th scope="col">Entidad</th>
              <th scope="col">ID entidad</th>
              <th scope="col">Fecha</th>
              <th scope="col">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td data-label="ID">{{ log.id }}</td>
              <td data-label="Usuario">{{ log.userId ?? 'Sistema' }}</td>
              <td data-label="Acción">
                <span class="action-badge">{{ log.action }}</span>
              </td>
              <td data-label="Entidad">{{ log.entityName }}</td>
              <td data-label="ID entidad">{{ log.entityId ?? '—' }}</td>
              <td data-label="Fecha">{{ formatDate(log.createdAt) }}</td>
              <td data-label="Detalle">
                <button
                  class="detail-button"
                  type="button"
                  :aria-label="`Consultar detalle del registro ${log.id}`"
                  @click="openDetail(log.id)"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <nav
        v-if="pagination && pagination.totalPages > 1"
        class="pagination"
        aria-label="Paginación de auditoría"
      >
        <button
          class="secondary-button"
          type="button"
          :disabled="page <= 1 || loading"
          @click="changePage(page - 1)"
        >
          Anterior
        </button>

        <span aria-live="polite">
          Página {{ pagination.page }} de {{ pagination.totalPages }}
        </span>

        <button
          class="secondary-button"
          type="button"
          :disabled="page >= pagination.totalPages || loading"
          @click="changePage(page + 1)"
        >
          Siguiente
        </button>
      </nav>
    </section>

    <div
  v-if="detailLoading || detailError || selectedLog"
  class="detail-backdrop"
  tabindex="-1"
  @keydown.esc="closeDetail"
  @click.self="closeDetail"
>
      <section
        class="detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <header class="detail-header">
          <div>
            <p class="eyebrow">REGISTRO DE AUDITORÍA</p>
            <h2 id="detail-title">Detalle del evento</h2>
          </div>
          <button class="close-button" type="button" aria-label="Cerrar detalle" @click="closeDetail">
            ×
          </button>
        </header>

        <div v-if="detailLoading" class="feedback-card" role="status">
          <span class="loading-indicator" aria-hidden="true"></span>
          <span>Cargando detalle...</span>
        </div>

        <div v-else-if="detailError" class="feedback-card error-card" role="alert">
          {{ detailError }}
        </div>

        <template v-else-if="selectedLog">
          <dl class="detail-list">
            <div>
              <dt>ID</dt>
              <dd>{{ selectedLog.id }}</dd>
            </div>
            <div>
              <dt>Usuario</dt>
              <dd>{{ selectedLog.userId ?? 'Sistema' }}</dd>
            </div>
            <div>
              <dt>Acción</dt>
              <dd>{{ selectedLog.action }}</dd>
            </div>
            <div>
              <dt>Entidad</dt>
              <dd>{{ selectedLog.entityName }}</dd>
            </div>
            <div>
              <dt>ID de entidad</dt>
              <dd>{{ selectedLog.entityId ?? 'No disponible' }}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>{{ formatDate(selectedLog.createdAt) }}</dd>
            </div>
          </dl>

          <div class="metadata-section">
            <h3>Metadatos</h3>
            <pre>{{ formatMetadata(selectedLog.metadata) }}</pre>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.audit-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  text-align: left;
  color: var(--color-text, #111827);
}

.audit-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.eyebrow {
  margin-bottom: 0.4rem;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.audit-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.6rem, 3vw, 2rem);
  letter-spacing: -0.03em;
}

.description,
.section-heading p {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

.refresh-button,
.primary-button,
.secondary-button,
.retry-button,
.detail-button {
  border: 0;
  border-radius: var(--radius-md, 0.5rem);
  padding: 0.7rem 0.95rem;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button,
.primary-button {
  background: var(--color-primary, #31456e);
  color: white;
}

.secondary-button {
  border: 1px solid var(--color-border, #d1d5db);
  background: white;
  color: var(--color-text, #111827);
}

.retry-button {
  background: #991b1b;
  color: white;
}

.detail-button {
  padding: 0.45rem 0.65rem;
  background: #e8edf5;
  color: #31456e;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button:focus-visible,
input:focus-visible {
  outline: 3px solid var(--color-primary, #31456e);
  outline-offset: 3px;
}

.filters-card,
.feedback-card,
.detail-dialog {
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--color-surface, #fff);
  padding: 1.5rem;
}

.filters-card {
  margin-bottom: 2rem;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-heading h2 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.filters-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: var(--color-text, #111827);
  font-size: 0.85rem;
  font-weight: 600;
}

.filters-grid input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-md, 0.5rem);
  padding: 0.7rem;
  background: white;
  color: #111827;
  font: inherit;
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.count-badge,
.action-badge {
  flex-shrink: 0;
  padding: 0.35rem 0.65rem;
  border-radius: 2rem;
  background: #e8edf5;
  color: #31456e;
  font-size: 0.8rem;
  font-weight: 700;
}

.results-section {
  min-width: 0;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;
}

th,
td {
  padding: 0.9rem 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

th {
  background: #f8fafc;
  color: #374151;
  font-weight: 700;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover {
  background: #f8fafc;
}

.empty-state {
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  color: var(--color-text-secondary, #6b7280);
  text-align: center;
}

.feedback-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feedback-card h3 {
  margin: 0 0 0.5rem;
}

.feedback-card p {
  margin-bottom: 1rem;
  color: var(--color-text-secondary, #6b7280);
}

.error-card {
  border-color: #fecaca;
  background: #fef2f2;
}

.loading-indicator {
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 1.5rem;
  border: 3px solid #dbeafe;
  border-top-color: var(--color-primary, #31456e);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.25rem;
  font-size: 0.9rem;
}

.detail-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(15 23 42 / 55%);
}

.detail-dialog {
  width: min(650px, 100%);
  max-height: min(85vh, 800px);
  overflow-y: auto;
  box-shadow: 0 20px 50px rgb(0 0 0 / 20%);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.detail-header h2 {
  margin: 0;
  font-size: 1.3rem;
}

.close-button {
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 50%;
  background: white;
  color: #111827;
  font-size: 1.5rem;
  cursor: pointer;
}

.detail-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 0;
}

.detail-list > div {
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--radius-md, 0.5rem);
  background: #f8fafc;
}

.detail-list dt {
  margin-bottom: 0.3rem;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.8rem;
  font-weight: 600;
}

.detail-list dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-size: 0.9rem;
}

.metadata-section {
  margin-top: 1.25rem;
}

.metadata-section h3 {
  font-size: 1rem;
}

.metadata-section pre {
  max-height: 250px;
  overflow: auto;
  padding: 1rem;
  border-radius: var(--radius-md, 0.5rem);
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 850px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .audit-page {
    padding: 1.25rem;
  }

  .audit-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .table-wrapper {
    overflow: visible;
    border: 0;
    background: transparent;
  }

  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  tbody {
    display: grid;
    gap: 0.85rem;
  }

  tbody tr {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border, #d1d5db);
    border-radius: var(--radius-lg, 0.75rem);
    background: white;
  }

  td {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.65rem 0;
    border-bottom: 1px solid #e5e7eb;
    white-space: normal;
    text-align: right;
  }

  td::before {
    content: attr(data-label);
    color: #6b7280;
    font-weight: 700;
    text-align: left;
  }

  td:last-child {
    border-bottom: 0;
  }
}

@media (max-width: 520px) {
  .filters-grid,
  .detail-list {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-actions button {
    width: 100%;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination {
    gap: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-indicator {
    animation: none;
  }
}
</style>
