<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardSummary } from '@/types/dashboard';

const authStore = useAuthStore();

const summary = ref<DashboardSummary | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const userName = computed(() => {
  const user = authStore.user;
  return user ? `${user.firstName} ${user.lastName}` : 'Usuario';
});

const roleLabel = computed(() => {
  const labels = {
    ADMIN: 'Administrador',
    DOCENTE: 'Docente',
    ESTUDIANTE: 'Estudiante',
  };

  return authStore.user
    ? labels[authStore.user.role] ?? 'Usuario'
    : 'Usuario';
});

const metrics = computed(() => {
  if (!summary.value) return [];

  const counts = summary.value.counts;

  const items = [
    {
      label: 'Carreras activas',
      value: counts.activeCareers,
      description: 'Carreras registradas y activas',
    },
    {
      label: 'Materias activas',
      value: counts.activeSubjects,
      description: 'Materias disponibles en el sistema',
    },
    {
      label: 'Materiales visibles',
      value: counts.visibleMaterials,
      description: 'Materiales disponibles según tu rol',
    },
  ];

  if (counts.myAssignments !== null) {
    items.push({
      label: 'Mis asignaciones',
      value: counts.myAssignments,
      description: 'Asignaciones relacionadas contigo',
    });
  }

  if (counts.myMaterials !== null) {
    items.push({
      label: 'Mis materiales',
      value: counts.myMaterials,
      description: 'Materiales que has registrado',
    });
  }

  return items;
});

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(err)) {
    return err.response?.data?.message
      ?? (err.request
        ? 'No fue posible comunicarse con el servidor. Comprueba tu conexión e inténtalo nuevamente.'
        : 'Ocurrió un error al realizar la consulta.');
  }

  return err instanceof Error
    ? err.message
    : 'Ocurrió un error inesperado al cargar el dashboard.';
}

async function loadDashboard() {
  loading.value = true;
  error.value = null;

  try {
    summary.value = await dashboardService.getSummary();
  } catch (err: unknown) {
    console.error('Error al cargar el dashboard:', err);
    error.value = getErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="dashboard-page">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">SIGRA / PANEL PRINCIPAL</p>
        <h1>Bienvenido, {{ userName }}</h1>
        <p class="description">
          Resumen general del Repositorio Colaborativo de Planeación y Recursos Académicos.
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="loading"
        @click="loadDashboard"
      >
        {{ loading ? 'Actualizando...' : 'Actualizar información' }}
      </button>
    </header>

    <section class="welcome-card" aria-label="Información de la sesión">
      <div>
        <p class="eyebrow">SESIÓN ACTUAL</p>
        <h2>{{ roleLabel }}</h2>
        <p>
          <template v-if="summary?.currentPeriod">
            Periodo académico:
            <strong>{{ summary.currentPeriod.code }}</strong>
            — {{ summary.currentPeriod.name }}
          </template>
          <template v-else>
            No hay un periodo académico activo disponible.
          </template>
        </p>
      </div>
      <span class="role-badge">{{ roleLabel }}</span>
    </section>

    <section
      v-if="loading && !summary"
      class="feedback-card"
      role="status"
      aria-live="polite"
    >
      <span class="loading-indicator" aria-hidden="true"></span>
      <div>
        <h2>Cargando dashboard</h2>
        <p>Estamos consultando la información del sistema.</p>
      </div>
    </section>

    <section v-else-if="error && !summary" class="feedback-card error-card" role="alert">
      <div>
        <h2>No fue posible cargar el dashboard</h2>
        <p>{{ error }}</p>
        <button class="retry-button" type="button" @click="loadDashboard">
          Reintentar
        </button>
      </div>
    </section>

    <template v-else-if="summary">
      <section class="metrics-section" aria-labelledby="metrics-title">
        <div class="section-heading">
          <div>
            <h2 id="metrics-title">Indicadores generales</h2>
            <p>Información disponible para tu tipo de cuenta.</p>
          </div>
        </div>

        <div class="metrics-grid">
          <article v-for="metric in metrics" :key="metric.label" class="metric-card">
            <p class="metric-label">{{ metric.label }}</p>
            <p class="metric-value">{{ metric.value }}</p>
            <p class="metric-description">{{ metric.description }}</p>
          </article>
        </div>
      </section>

      <section class="materials-section" aria-labelledby="materials-title">
        <div class="section-heading">
          <div>
            <h2 id="materials-title">Materiales recientes</h2>
            <p>Últimos materiales visibles para tu cuenta.</p>
          </div>
          <span class="count-badge">{{ summary.recentMaterials.length }} registros</span>
        </div>

        <div v-if="summary.recentMaterials.length" class="materials-list">
          <article
            v-for="material in summary.recentMaterials"
            :key="material.id"
            class="material-card"
          >
            <div class="material-main">
              <div>
                <h3>{{ material.title }}</h3>
                <p class="material-subject">
                  {{ material.subject.code }} — {{ material.subject.name }}
                </p>
              </div>
              <span class="material-type">{{ material.materialType }}</span>
            </div>

            <p v-if="material.description" class="material-description">
              {{ material.description }}
            </p>

            <div class="material-meta">
              <span>
                Autor: {{ material.author.firstName }} {{ material.author.lastName }}
              </span>
              <span>Versión {{ material.currentVersion }}</span>
              <span>{{ material.downloadCount }} descargas</span>
              <time :datetime="material.createdAt">
                {{ formatDate(material.createdAt) }}
              </time>
            </div>
          </article>
        </div>

        <div v-else class="empty-materials" role="status">
          No hay materiales recientes disponibles para mostrar.
        </div>
      </section>
    </template>

    <p v-if="error && summary" class="inline-error" role="alert">
      No se pudo actualizar la información: {{ error }}
    </p>
  </div>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  text-align: left;
  color: var(--color-text, #111827);
}

.dashboard-header {
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

.dashboard-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.6rem, 3vw, 2rem);
  letter-spacing: -0.03em;
}

.description,
.section-heading p,
.metric-description,
.material-description,
.material-meta {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

.refresh-button,
.retry-button {
  border: 0;
  border-radius: var(--radius-md, 0.5rem);
  padding: 0.75rem 1rem;
  background: var(--color-primary, #31456e);
  color: white;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.refresh-button:focus-visible,
.retry-button:focus-visible {
  outline: 3px solid var(--color-primary-hover, #243758);
  outline-offset: 3px;
}

.welcome-card,
.metric-card,
.material-card,
.feedback-card {
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--color-surface, #fff);
  padding: 1.5rem;
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  background: var(--color-background, #f8fafc);
}

.welcome-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.welcome-card p:last-child {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
}

.role-badge,
.count-badge,
.material-type {
  flex-shrink: 0;
  padding: 0.35rem 0.7rem;
  border-radius: 2rem;
  background: #e8edf5;
  color: #31456e;
  font-size: 0.8rem;
  font-weight: 700;
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

.metrics-section {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 1rem;
}

.metric-card {
  min-width: 0;
}

.metric-label {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.9rem;
  font-weight: 600;
}

.metric-value {
  margin: 0.6rem 0;
  color: var(--color-text, #111827);
  font-size: 2rem;
  font-weight: 750;
  line-height: 1.2;
}

.metric-description {
  margin: 0;
  font-size: 0.8rem;
}

.materials-list {
  display: grid;
  gap: 0.85rem;
}

.material-card {
  min-width: 0;
}

.material-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.material-main h3 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
}

.material-subject {
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.85rem;
}

.material-description {
  margin-top: 0.85rem;
}

.material-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  margin-top: 1rem;
  font-size: 0.8rem;
}

.empty-materials {
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

.feedback-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
}

.feedback-card p {
  margin-bottom: 1rem;
  color: var(--color-text-secondary, #6b7280);
}

.error-card {
  border-color: #fecaca;
  background: #fef2f2;
}

.retry-button {
  background: #991b1b;
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

.inline-error {
  margin-top: 1rem;
  color: #991b1b;
  font-size: 0.9rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1.25rem;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .welcome-card,
  .material-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-indicator {
    animation: none;
  }
}
</style>
