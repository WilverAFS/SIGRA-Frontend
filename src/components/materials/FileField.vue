<script setup lang="ts">
import { computed } from 'vue';

import { FILE_ACCEPT, formatBytes } from '@/utils/archivos';

const model = defineModel<File | null>({ default: null });

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    required?: boolean;
    error?: string | null;
    disabled?: boolean;
  }>(),
  { required: false, error: null, disabled: false },
);

const hint = 'PDF, Word, PowerPoint o Excel. Máximo 25 MB.';
const describedBy = computed(() =>
  props.error ? `${props.id}-error` : `${props.id}-hint`,
);

function onChange(event: Event) {
  const input = event.target as HTMLInputElement;
  model.value = input.files?.[0] ?? null;
}
</script>

<template>
  <div class="form-group">
    <label :for="id" class="form-label">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>

    <input
      :id="id"
      type="file"
      class="file-input"
      :class="{ 'file-input-error': error }"
      :accept="FILE_ACCEPT"
      :required="required"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="describedBy"
      @change="onChange"
    >

    <p v-if="model" class="file-selected">
      {{ model.name }} · {{ formatBytes(model.size) }}
    </p>
    <p v-if="error" :id="`${id}-error`" class="form-error" role="alert">
      {{ error }}
    </p>
    <p v-else :id="`${id}-hint`" class="form-hint">
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-weight: 600;
}

.file-input {
  padding: 0.6rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
}

.file-input-error {
  border-color: var(--color-danger);
}

.file-selected,
.form-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
