<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import NewVersionForm from '@/components/materials/NewVersionForm.vue';
import VersionHistory from '@/components/materials/VersionHistory.vue';
import ErrorState from '@/components/ui/ErrorState.vue';
import LoadingState from '@/components/ui/LoadingState.vue';
import { materialsService } from '@/services/materials.service';
import { useAuthStore } from '@/stores/auth';
import {
  type Material,
  materialTypeLabels,
  visibilityLabels,
} from '@/types/materials';
import { formatBytes, saveBlob } from '@/utils/archivos';
import { getErrorMessage, getErrorStatus } from '@/utils/error-handler';
import {
  puedeGestionarMaterial,
  puedeVerHistorial,
} from '@/utils/permisos-materiales';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const id = computed(() => Number(route.params.id));
const material = ref<Material | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const actionError = ref<string | null>(null);
const downloading = ref(false);
const confirmingDelete = ref(false);
const deleting = ref(false);
const history = ref<InstanceType<typeof VersionHistory> | null>(null);

const canManage = computed(
  () => !!material.value && puedeGestionarMaterial(authStore.user, material.value),
);
const canSeeHistory = computed(() => puedeVerHistorial(authStore.user));
const current = computed(() => material.value?.currentVersionDetail);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    material.value = await materialsService.get(id.value);
  } catch (err) {
    error.value =
      getErrorStatus(err) === 404
        ? 'El material no existe o no tienes acceso a él.'
        : getErrorMessage(err, 'No se pudo cargar el material.');
  } finally {
    loading.value = false;
  }
}

async function downloadCurrent() {
  if (!material.value) return;
  downloading.value = true;
  actionError.value = null;
  try {
    const file = await materialsService.downloadCurrent(material.value.id);
    saveBlob(file.blob, file.fileName || current.value?.originalFileName || 'material');
    material.value.downloadCount += 1;
  } catch (err) {
    actionError.value = getErrorMessage(err, 'No se pudo descargar el archivo.');
  } finally {
    downloading.value = false;
  }
}

async function remove() {
  if (!material.value) return;
  deleting.value = true;
  actionError.value = null;
  try {
    await materialsService.remove(material.value.id);
    await router.push('/materiales');
  } catch (err) {
    actionError.value = getErrorMessage(err, 'No se pudo eliminar el material.');
    confirmingDelete.value = false;
  } finally {
    deleting.value = false;
  }
}

/**
 * Tras subir una versión, actualizar el detalle y el historial sin mostrar
 * el estado de carga (así no se pierde el mensaje de éxito del formulario).
 */
async function onVersionUploaded() {
  try {
    material.value = await materialsService.get(id.value);
  } catch (err) {
    actionError.value = getErrorMessage(err, 'No se pudo actualizar el material.');
  }
  await history.value?.reload();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

onMounted(load);
</script>

<template>
  <section class="detail-page">
    <RouterLink to="/materiales" class="back-link">
      ← Materiales
    </RouterLink>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="error" :message="error" />

    <template v-else-if="material">
      <header class="detail-header">
        <div>
          <div class="tags">
            <span class="tag">{{ materialTypeLabels[material.materialType] }}</span>
            <span class="tag" :class="{ 'tag-warning': material.visibility === 'SOLO_DOCENTES' }">
              {{ visibilityLabels[material.visibility] }}
            </span>
            <span v-if="!material.isApproved" class="tag tag-muted">Sin aprobar</span>
          </div>
          <h1>{{ material.title }}</h1>
          <p v-if="material.subject" class="subtitle">
            {{ material.subject.code }} · {{ material.subject.name }}
            <template v-if="material.academicPeriod">
              · {{ material.academicPeriod.name }}
            </template>
          </p>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="button button-primary"
            :disabled="downloading"
            data-test="download-current"
            @click="downloadCurrent"
          >
            {{ downloading ? 'Descargando...' : 'Descargar' }}
          </button>
          <template v-if="canManage">
            <RouterLink
              :to="`/materiales/${material.id}/editar`"
              class="button button-secondary"
              data-test="edit-material"
            >
              Editar
            </RouterLink>
            <button
              type="button"
              class="button button-danger"
              data-test="delete-material"
              @click="confirmingDelete = true"
            >
              Eliminar
            </button>
          </template>
        </div>
      </header>

      <div v-if="confirmingDelete" class="confirm-box" role="alertdialog" aria-labelledby="confirm-title">
        <p id="confirm-title">
          ¿Eliminar <strong>{{ material.title }}</strong>? Sus versiones dejarán de poder descargarse.
        </p>
        <div class="confirm-actions">
          <button
            type="button"
            class="button button-danger"
            :disabled="deleting"
            data-test="confirm-delete"
            @click="remove"
          >
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
          <button type="button" class="button button-secondary" @click="confirmingDelete = false">
            Cancelar
          </button>
        </div>
      </div>

      <p v-if="actionError" class="action-error" role="alert">
        {{ actionError }}
      </p>

      <div class="detail-grid">
        <article class="panel">
          <h2>Descripción</h2>
          <p>{{ material.description || 'Sin descripción.' }}</p>
          <template v-if="material.syllabusChangesNote">
            <h3>Cambios al temario</h3>
            <p>{{ material.syllabusChangesNote }}</p>
          </template>
        </article>

        <aside class="panel">
          <h2>Datos</h2>
          <dl class="data-list">
            <template v-if="material.author">
              <dt>Autor</dt>
              <dd>{{ material.author.firstName }} {{ material.author.lastName }}</dd>
            </template>
            <dt>Versión vigente</dt>
            <dd>v{{ material.currentVersion }}</dd>
            <template v-if="current">
              <dt>Archivo</dt>
              <dd class="break">
                {{ current.originalFileName }} ({{ formatBytes(current.fileSizeBytes) }})
              </dd>
            </template>
            <dt>Descargas</dt>
            <dd>{{ material.downloadCount }}</dd>
            <dt>Actualizado</dt>
            <dd>{{ formatDate(material.updatedAt) }}</dd>
          </dl>
        </aside>
      </div>

      <NewVersionForm
        v-if="canManage"
        :material-id="material.id"
        class="block"
        @uploaded="onVersionUploaded"
      />

      <VersionHistory
        v-if="canSeeHistory"
        ref="history"
        :material-id="material.id"
        :current-version="material.currentVersion"
        class="block"
      />
    </template>
  </section>
</template>

<style scoped>
.detail-page {
  text-align: left;
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
  color: var(--color-text);
}

.back-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1rem 0 1.5rem;
}

.detail-header h1 {
  margin: 0.5rem 0 0.25rem;
  font-size: 1.75rem;
  color: var(--color-text);
}

.subtitle {
  margin: 0;
  color: var(--color-text-secondary);
}

.tags {
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

.header-actions,
.confirm-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.button {
  font: inherit;
  font-size: 0.95rem;
  line-height: 1.2;
  display: inline-block;
  padding: 0.65rem 1.1rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-primary {
  background: var(--color-primary);
  color: white;
}

.button-secondary {
  background: white;
  border-color: var(--color-border);
  color: var(--color-text);
}

.button-danger {
  background: white;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.confirm-box {
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  background: #fef2f2;
}

.confirm-box p {
  margin: 0 0 0.75rem;
}

.action-error {
  color: var(--color-danger);
  margin: 0 0 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

.panel {
  padding: 1.25rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: var(--color-primary);
}

.panel h3 {
  margin: 1rem 0 0.25rem;
  font-size: 1rem;
}

.panel p {
  margin: 0;
  white-space: pre-line;
}

.data-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 0.75rem;
  margin: 0;
}

.data-list dt {
  white-space: nowrap;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.data-list dd {
  margin: 0;
}

.break {
  overflow-wrap: anywhere;
}

.block {
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .detail-page {
    padding: 1rem;
  }

  .detail-header h1 {
    font-size: 1.4rem;
  }
}
</style>
