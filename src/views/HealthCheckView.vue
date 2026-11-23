<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import {
  healthService,
  type HealthData,
  type DependencyStatus,
} from '@/services/health.service';

const loading = ref(false);
const error = ref<string | null>(null);
const healthInfo = ref<HealthData | null>(null);

const dependencies = computed(() => {
  if (!healthInfo.value) return [];

  return [
    {
      key: 'database',
      label: 'Base de datos',
      technology: 'PostgreSQL',
      status: healthInfo.value.services.database,
    },
    {
      key: 'cache',
      label: 'Caché',
      technology: 'Redis',
      status: healthInfo.value.services.cache,
    },
    {
      key: 'queue',
      label: 'Cola de mensajes',
      technology: 'RabbitMQ',
      status: healthInfo.value.services.queue,
    },
  ];
});

const overallStatusLabel = computed(() => {
  if (!healthInfo.value) return '';

  return healthInfo.value.status === 'ok'
    ? 'Todos los servicios operan correctamente'
    : 'Servicio degradado: hay dependencias que no responden';
});

function dependencyStatusLabel(status: DependencyStatus): string {
  return status === 'up' ? 'Disponible' : 'No disponible';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

async function checkHealth() {
  loading.value = true;
  error.value = null;
  healthInfo.value = null;

  try {
    const result = await healthService.getHealth();

    healthInfo.value = result;
  } catch (err: unknown) {
    console.error('Error al consultar el estado del backend:', err);

    if (axios.isAxiosError<{ message?: string }>(err)) {
      error.value = err.response?.data?.message
        ?? (err.request
          ? 'No fue posible comunicarse con el servidor. Comprueba la conexión e inténtalo nuevamente.'
          : 'Ocurrió un error al realizar la consulta.');
    } else {
      error.value = err instanceof Error
        ? err.message
        : 'Ocurrió un error inesperado al consultar el estado del servicio.';
    }
  } finally {
    loading.value = false;
  }
}

onMounted(checkHealth);
</script>

<template>
  <div class="health-page">
    <header class="health-header">
      <div>
        <p class="eyebrow">SIGRA / SISTEMA</p>
        <h1>Estado del sistema</h1>
        <p class="description">
          Diagnóstico de disponibilidad de los servicios que utiliza SIGRA.
        </p>
      </div>

      <button
        class="refresh-button"
        type="button"
        :disabled="loading"
        @click="checkHealth"
      >
        <span aria-hidden="true">{{ loading ? '↻' : '⟳' }}</span>
        {{ loading ? 'Consultando...' : 'Actualizar estado' }}
      </button>
    </header>

    <section
      v-if="loading"
      class="feedback-card"
      role="status"
      aria-live="polite"
    >
      <span class="loading-indicator" aria-hidden="true"></span>
      <div>
        <h2>Consultando servicios</h2>
        <p>Estamos verificando la disponibilidad del backend y sus dependencias.</p>
      </div>
    </section>

    <section
      v-else-if="error"
      class="feedback-card error-card"
      role="alert"
    >
      <div class="feedback-icon" aria-hidden="true">!</div>
      <div>
        <h2>No fue posible obtener el estado</h2>
        <p>{{ error }}</p>
        <button
          class="retry-button"
          type="button"
          @click="checkHealth"
        >
          Reintentar consulta
        </button>
      </div>
    </section>

    <template v-else-if="healthInfo">
      <section
        class="overall-card"
        :class="healthInfo.status === 'ok' ? 'is-ok' : 'is-degraded'"
        aria-live="polite"
      >
        <div>
          <p class="eyebrow">ESTADO GENERAL</p>
          <h2>{{ overallStatusLabel }}</h2>
          <p>
            API versión {{ healthInfo.version }}
          </p>
        </div>

        <span class="overall-badge">
          {{ healthInfo.status === 'ok' ? 'Operativo' : 'Degradado' }}
        </span>
      </section>

      <section class="dependencies-section">
        <div class="section-heading">
          <div>
            <h2>Dependencias del sistema</h2>
            <p>Disponibilidad reportada por el backend.</p>
          </div>
        </div>

        <div class="dependency-grid">
          <article
            v-for="dependency in dependencies"
            :key="dependency.key"
            class="dependency-card"
          >
            <div class="dependency-top">
              <div>
                <h3>{{ dependency.label }}</h3>
                <p>{{ dependency.technology }}</p>
              </div>

              <span
                class="dependency-indicator"
                :class="dependency.status === 'up' ? 'is-up' : 'is-down'"
                :aria-label="dependencyStatusLabel(dependency.status)"
              ></span>
            </div>

            <p
              class="dependency-status"
              :class="dependency.status === 'up' ? 'text-up' : 'text-down'"
            >
              {{ dependencyStatusLabel(dependency.status) }}
            </p>
          </article>
        </div>
      </section>

      <footer class="health-footer">
        <p>
          Última comprobación:
          <time :datetime="healthInfo.timestamp">
            {{ formatDate(healthInfo.timestamp) }}
          </time>
        </p>
      </footer>
    </template>
  </div>
</template>

<style scoped>
.health-page {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  text-align: left;
  color: var(--color-text, #111827);
}

.health-header {
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

.health-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.6rem, 3vw, 2rem);
  letter-spacing: -0.03em;
}

.description,
.section-heading p,
.dependency-top p,
.overall-card > div > p:last-child,
.feedback-card p {
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

.feedback-card,
.overall-card,
.dependency-card {
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: var(--radius-lg, 0.75rem);
  background: var(--color-surface, #fff);
  padding: 1.5rem;
}

.feedback-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.feedback-card h2,
.overall-card h2,
.section-heading h2 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
}

.feedback-card p {
  margin-bottom: 1rem;
}

.error-card {
  border-color: #fecaca;
  background: #fef2f2;
}

.feedback-icon {
  display: grid;
  flex: 0 0 2rem;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 800;
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

.overall-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.overall-card.is-ok {
  border-left: 5px solid var(--color-success, #16a34a);
}

.overall-card.is-degraded {
  border-left: 5px solid var(--color-warning, #f59e0b);
}

.overall-card h2 {
  margin-bottom: 0.4rem;
}

.overall-card > div > p:last-child {
  margin: 0;
}

.overall-badge {
  flex-shrink: 0;
  padding: 0.4rem 0.75rem;
  border-radius: 2rem;
  background: #dcfce7;
  color: #166534;
  font-size: 0.8rem;
  font-weight: 700;
}

.is-degraded .overall-badge {
  background: #fef3c7;
  color: #92400e;
}

.section-heading {
  margin-bottom: 1rem;
}

.section-heading p {
  margin: 0;
}

.dependency-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.dependency-card {
  min-width: 0;
}

.dependency-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.dependency-top h3 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
}

.dependency-top p {
  margin: 0;
}

.dependency-indicator {
  width: 0.7rem;
  height: 0.7rem;
  flex-shrink: 0;
  margin-top: 0.3rem;
  border-radius: 50%;
}

.dependency-indicator.is-up {
  background: var(--color-success, #16a34a);
}

.dependency-indicator.is-down {
  background: var(--color-danger, #dc2626);
}

.dependency-status {
  margin: 1.5rem 0 0;
  font-size: 0.9rem;
  font-weight: 700;
}

.text-up {
  color: var(--color-success, #16a34a);
}

.text-down {
  color: var(--color-danger, #dc2626);
}

.health-footer {
  margin-top: 1.5rem;
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.8rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .health-page {
    padding: 1.25rem;
  }

  .health-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .dependency-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .overall-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-indicator {
    animation-duration: 2s;
  }
}
</style>
