<script setup lang="ts">
import { onMounted, ref } from 'vue';

import EmptyState from '@/components/ui/EmptyState.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { materialsService } from '@/services/materials.service';
import type { MaterialVersion } from '@/types/materials';
import { formatBytes, saveBlob } from '@/utils/archivos';
import { getErrorMessage } from '@/utils/error-handler';

/**
 * Historial de versiones (6.8.7) y descarga de una versión concreta
 * (6.8.10). Solo se muestra a DOCENTE y ADMIN.
 */
const props = defineProps<{ materialId: number; currentVersion: number }>();

const versions = ref<MaterialVersion[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const downloadError = ref<string | null>(null);
const downloading = ref<number | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const response = await materialsService.listVersions(props.materialId, {
      limit: 100,
    });
    versions.value = response.data;
  } catch (err) {
    error.value = getErrorMessage(err, 'No se pudo cargar el historial.');
  } finally {
    loading.value = false;
  }
}

async function download(version: MaterialVersion) {
  downloading.value = version.versionNumber;
  downloadError.value = null;
  try {
    const result = await materialsService.downloadVersion(
      props.materialId,
      version.versionNumber,
    );
    saveBlob(result.blob, result.fileName || version.originalFileName);
  } catch (err) {
    downloadError.value = getErrorMessage(err, 'No se pudo descargar la versión.');
  } finally {
    downloading.value = null;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

onMounted(load);
defineExpose({ reload: load });
</script>

<template>
  <section class="history" aria-labelledby="history-title">
    <h2 id="history-title">
      Historial de versiones
    </h2>
    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" />
    <EmptyState v-else-if="versions.length === 0" message="Este material aún no tiene versiones." />
    <template v-else>
      <p v-if="downloadError" class="inline-error" role="alert">
        {{ downloadError }}
      </p>
      <ol class="version-list">
        <li v-for="version in versions" :key="version.id" class="version-item">
          <div class="version-info">
            <p class="version-title">
              Versión {{ version.versionNumber }}
              <span v-if="version.versionNumber === currentVersion" class="current-badge">Vigente</span>
            </p>
            <p class="version-meta">
              {{ version.originalFileName }} · {{ formatBytes(version.fileSizeBytes) }} ·
              {{ formatDate(version.createdAt) }}
            </p>
            <p v-if="version.changelog" class="version-changelog">
              {{ version.changelog }}
            </p>
          </div>
          <button
            type="button"
            class="button-link"
            :disabled="downloading === version.versionNumber"
            :aria-label="`Descargar versión ${version.versionNumber}`"
            @click="download(version)"
          >
            {{ downloading === version.versionNumber ? 'Descargando...' : 'Descargar' }}
          </button>
        </li>
      </ol>
    </template>
  </section>
</template>

<style scoped>
.history,
.new-version {
  text-align: left;
}

.history h2 {
  font-size: 1.25rem;
  color: var(--color-primary);
  margin: 0 0 0.75rem;
}

.version-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: white;
}

.version-title {
  margin: 0;
  font-weight: 700;
}

.current-badge {
  margin-left: 0.4rem;
  font-size: 0.75rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #dcfce7;
  color: var(--color-success);
}

.version-meta,
.version-changelog {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.button-link {
  font: inherit;
  font-size: 0.9rem;
  border: 1px solid var(--color-primary);
  background: white;
  color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: 0.45rem 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.button-link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.inline-error {
  color: var(--color-danger);
  margin: 0 0 0.5rem;
}

@media (max-width: 640px) {
  .version-item {
    flex-direction: column;
  }
}
</style>
