<script setup lang="ts">
import { ref } from 'vue';

import BaseInput from '@/components/forms/BaseInput.vue';
import { materialsService } from '@/services/materials.service';
import type { MaterialVersion } from '@/types/materials';
import { archivoValido } from '@/utils/archivos';
import {
  getErrorCode,
  getErrorMessage,
  getFieldError,
} from '@/utils/error-handler';

import FileField from './FileField.vue';

/** Subir una versión nueva (6.8.8): archivo + nota de cambios. */
const props = defineProps<{ materialId: number }>();
const emit = defineEmits<{ uploaded: [version: MaterialVersion] }>();

const file = ref<File | null>(null);
const changelog = ref('');
const fileError = ref('');
const changelogError = ref('');
const serverError = ref<string | null>(null);
const success = ref<string | null>(null);
const saving = ref(false);

async function submit() {
  fileError.value = archivoValido(file.value) ?? '';
  changelogError.value = '';
  serverError.value = null;
  success.value = null;
  if (fileError.value) {
    return;
  }
  saving.value = true;
  try {
    const version = await materialsService.createVersion(
      props.materialId,
      file.value!,
      changelog.value,
    );
    success.value = `Se subió la versión ${version.versionNumber}.`;
    file.value = null;
    changelog.value = '';
    emit('uploaded', version);
  } catch (err) {
    const code = getErrorCode(err);
    fileError.value = getFieldError(err, 'file') ?? '';
    changelogError.value = getFieldError(err, 'changelog') ?? '';
    if (code === 'FILE_TOO_LARGE' || code === 'FILE_TYPE_NOT_ALLOWED') {
      fileError.value = getErrorMessage(err);
    } else if (code === 'FORBIDDEN_SUBJECT_ASSIGNMENT') {
      serverError.value =
        'Ya no tienes asignada la materia de este material, así que no puedes subir versiones nuevas.';
    } else if (!fileError.value && !changelogError.value) {
      serverError.value = getErrorMessage(err, 'No se pudo subir la versión.');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="new-version" novalidate @submit.prevent="submit">
    <h2>Subir versión nueva</h2>
    <p class="hint">
      Las versiones anteriores se conservan en el historial.
    </p>
    <FileField
      id="version-file"
      v-model="file"
      label="Archivo"
      required
      :error="fileError"
    />
    <BaseInput
      id="version-changelog"
      v-model="changelog"
      label="¿Qué cambió? (recomendado)"
      placeholder="Se corrige la ponderación de la unidad 3."
      :error="changelogError"
    />
    <p v-if="serverError" class="server-error" role="alert">
      {{ serverError }}
    </p>
    <p v-if="success" class="success" role="status">
      {{ success }}
    </p>
    <button type="submit" class="button-primary" :disabled="saving">
      {{ saving ? 'Subiendo...' : 'Subir versión' }}
    </button>
  </form>
</template>

<style scoped>
.history,
.new-version {
  text-align: left;
}

.new-version {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background);
}

.new-version h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary);
}

.hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.server-error {
  margin: 0;
  color: var(--color-danger);
}

.success {
  margin: 0;
  color: var(--color-success);
  font-weight: 600;
}

.button-primary {
  font: inherit;
  font-size: 0.95rem;
  align-self: flex-start;
  padding: 0.7rem 1.1rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
