<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import SelectField from '@/components/materials/SelectField.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { catalogsService } from '@/services/catalogs.service';
import { materialsService } from '@/services/materials.service';
import { useAuthStore } from '@/stores/auth';
import type { PaginationMeta } from '@/types/api';
import {
  type CatalogOption,
  type Material,
  type MaterialListQuery,
  type MaterialType,
  type MaterialVisibility,
  materialTypeLabels,
  visibilityLabels,
} from '@/types/materials';
import { getErrorMessage } from '@/utils/error-handler';
import {
  puedeCrearMaterial,
  puedeFiltrarVisibilidad,
} from '@/utils/permisos-materiales';

const PAGE_SIZE = 12;

const authStore = useAuthStore();

const materials = ref<Material[]>([]);
const meta = ref<PaginationMeta | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const subjects = ref<CatalogOption[]>([]);
const periods = ref<CatalogOption[]>([]);

const filters = reactive({
  search: '',
  subjectId: '',
  academicPeriodId: '',
  materialType: '',
  visibility: '',
  sort: 'createdAt:desc',
});
const page = ref(1);

const canCreate = computed(() => puedeCrearMaterial(authStore.user));
const canFilterVisibility = computed(() =>
  puedeFiltrarVisibilidad(authStore.user),
);

const typeOptions = Object.entries(materialTypeLabels).map(([value, label]) => ({
  value,
  label,
}));
const visibilityOptions = Object.entries(visibilityLabels).map(
  ([value, label]) => ({ value, label }),
);
const sortOptions = [
  { value: 'createdAt:desc', label: 'Más recientes' },
  { value: 'createdAt:asc', label: 'Más antiguos' },
  { value: 'title:asc', label: 'Título (A–Z)' },
  { value: 'downloadCount:desc', label: 'Más descargados' },
];
const subjectOptions = computed(() =>
  subjects.value.map((s) => ({ value: String(s.id), label: `${s.code} · ${s.name}` })),
);
const periodOptions = computed(() =>
  periods.value.map((p) => ({ value: String(p.id), label: p.name })),
);

function buildQuery(): MaterialListQuery {
  return {
    page: page.value,
    limit: PAGE_SIZE,
    search: filters.search.trim() || undefined,
    subjectId: filters.subjectId ? Number(filters.subjectId) : undefined,
    academicPeriodId: filters.academicPeriodId
      ? Number(filters.academicPeriodId)
      : undefined,
    materialType: (filters.materialType || undefined) as MaterialType | undefined,
    visibility:
      canFilterVisibility.value && filters.visibility
        ? (filters.visibility as MaterialVisibility)
        : undefined,
    sort: filters.sort as MaterialListQuery['sort'],
  };
}

async function loadMaterials() {
  loading.value = true;
  error.value = null;
  try {
    const response = await materialsService.list(buildQuery());
    materials.value = response.data;
    meta.value = response.meta;
  } catch (err) {
    error.value = getErrorMessage(err, 'No se pudieron cargar los materiales.');
  } finally {
    loading.value = false;
  }
}

/** Los catálogos son opcionales: si fallan, se puede buscar por texto. */
async function loadCatalogs() {
  const [subjectsResult, periodsResult] = await Promise.allSettled([
    catalogsService.subjectOptions(),
    catalogsService.periodOptions(),
  ]);
  if (subjectsResult.status === 'fulfilled') subjects.value = subjectsResult.value;
  if (periodsResult.status === 'fulfilled') periods.value = periodsResult.value;
}

function applyFilters() {
  page.value = 1;
  void loadMaterials();
}

function clearFilters() {
  Object.assign(filters, {
    search: '',
    subjectId: '',
    academicPeriodId: '',
    materialType: '',
    visibility: '',
    sort: 'createdAt:desc',
  });
  applyFilters();
}

function goToPage(target: number) {
  page.value = target;
  void loadMaterials();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

onMounted(() => {
  void loadMaterials();
  void loadCatalogs();
});
</script>

<template>
  <section class="materials-page">
    <header class="page-header">
      <div>
        <h1>Materiales</h1>
        <p class="page-subtitle">
          Planeaciones, temarios, apuntes y demás recursos de las materias.
        </p>
      </div>
      <RouterLink
        v-if="canCreate"
        to="/materiales/nuevo"
        class="button button-primary"
        data-test="new-material"
      >
        Subir material
      </RouterLink>
    </header>

    <form class="filters" role="search" @submit.prevent="applyFilters">
      <div class="filter-search">
        <label for="search" class="form-label">Buscar</label>
        <input
          id="search"
          v-model="filters.search"
          type="search"
          class="search-input"
          placeholder="Título o descripción"
          maxlength="100"
        >
      </div>
      <SelectField
        id="filter-subject"
        v-model="filters.subjectId"
        label="Materia"
        placeholder="Todas"
        :options="subjectOptions"
      />
      <SelectField
        id="filter-period"
        v-model="filters.academicPeriodId"
        label="Periodo"
        placeholder="Todos"
        :options="periodOptions"
      />
      <SelectField
        id="filter-type"
        v-model="filters.materialType"
        label="Tipo"
        placeholder="Todos"
        :options="typeOptions"
      />
      <SelectField
        v-if="canFilterVisibility"
        id="filter-visibility"
        v-model="filters.visibility"
        label="Visibilidad"
        placeholder="Todas"
        :options="visibilityOptions"
      />
      <SelectField
        id="filter-sort"
        v-model="filters.sort"
        label="Ordenar por"
        placeholder="Más recientes"
        :options="sortOptions"
      />
      <div class="filter-actions">
        <button type="submit" class="button button-primary">
          Aplicar
        </button>
        <button type="button" class="button button-secondary" @click="clearFilters">
          Limpiar
        </button>
      </div>
    </form>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" />
    <EmptyState
      v-else-if="materials.length === 0"
      message="No se encontraron materiales con esos filtros."
    />

    <template v-else>
      <p class="results-count" aria-live="polite">
        {{ meta?.total ?? materials.length }} material(es) encontrados
      </p>
      <ul class="materials-grid">
        <li v-for="material in materials" :key="material.id" class="material-card">
          <div class="card-tags">
            <span class="tag">{{ materialTypeLabels[material.materialType] }}</span>
            <span
              v-if="material.visibility === 'SOLO_DOCENTES'"
              class="tag tag-warning"
            >Solo docentes</span>
            <span v-if="!material.isApproved" class="tag tag-muted">Sin aprobar</span>
          </div>
          <h2 class="card-title">
            <RouterLink :to="`/materiales/${material.id}`">
              {{ material.title }}
            </RouterLink>
          </h2>
          <p v-if="material.subject" class="card-meta">
            {{ material.subject.code }} · {{ material.subject.name }}
          </p>
          <p class="card-meta">
            <template v-if="material.author">
              {{ material.author.firstName }} {{ material.author.lastName }} ·
            </template>
            {{ material.academicPeriod?.name ?? '' }}
          </p>
          <p class="card-footer">
            v{{ material.currentVersion }} · {{ material.downloadCount }} descargas ·
            {{ formatDate(material.createdAt) }}
          </p>
        </li>
      </ul>

      <nav v-if="meta && meta.totalPages > 1" class="pagination" aria-label="Paginación">
        <button
          type="button"
          class="button button-secondary"
          :disabled="page <= 1"
          @click="goToPage(page - 1)"
        >
          Anterior
        </button>
        <span>Página {{ meta.page }} de {{ meta.totalPages }}</span>
        <button
          type="button"
          class="button button-secondary"
          :disabled="page >= meta.totalPages"
          @click="goToPage(page + 1)"
        >
          Siguiente
        </button>
      </nav>
    </template>
  </section>
</template>

<style scoped>
.materials-page {
  text-align: left;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--color-text);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--color-primary);
}

.page-subtitle {
  margin: 0.25rem 0 0;
  color: var(--color-text-secondary);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  align-items: end;
  padding: 1rem;
  margin-bottom: 1.5rem;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.filter-search {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  grid-column: 1 / -1;
}

.form-label {
  font-weight: 600;
}

.search-input {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
}

.button {
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.2;
  display: inline-block;
  padding: 0.7rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  text-align: center;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-primary {
  background: var(--color-primary);
  color: white;
}

.button-primary:hover {
  background: var(--color-primary-hover);
}

.button-secondary {
  background: white;
  border-color: var(--color-border);
  color: var(--color-text);
}

.results-count {
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem;
}

.materials-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.material-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #e0e7ff;
  color: var(--color-primary);
}

.tag-warning {
  background: #fef3c7;
  color: #92400e;
}

.tag-muted {
  background: #f3f4f6;
  color: var(--color-text-secondary);
}

.card-title {
  margin: 0.25rem 0 0;
  font-size: 1.1rem;
  line-height: 1.3;
}

.card-title a {
  color: var(--color-text);
  text-decoration: none;
}

.card-title a:hover,
.card-title a:focus-visible {
  color: var(--color-primary);
  text-decoration: underline;
}

.card-meta,
.card-footer {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.card-footer {
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 640px) {
  .materials-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .filter-actions {
    grid-column: 1 / -1;
  }

  .filter-actions .button {
    flex: 1;
  }
}
</style>
