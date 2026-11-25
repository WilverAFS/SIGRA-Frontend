<script setup lang="ts">
const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    id: string;
    label: string;
    placeholder?: string;
    rows?: number;
    maxlength?: number;
    error?: string | null;
    disabled?: boolean;
  }>(),
  { placeholder: '', rows: 3, maxlength: undefined, error: null, disabled: false },
);
</script>

<template>
  <div class="form-group">
    <label :for="id" class="form-label">{{ label }}</label>
    <textarea
      :id="id"
      v-model="model"
      class="form-textarea"
      :class="{ 'form-textarea-error': error }"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
    />
    <p v-if="error" :id="`${id}-error`" class="form-error" role="alert">
      {{ error }}
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

.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  font: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-textarea-error {
  border-color: var(--color-danger);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
