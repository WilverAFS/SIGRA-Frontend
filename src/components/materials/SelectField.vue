<script setup lang="ts">
/**
 * Selector simple con etiqueta y error junto al campo (mismo patrón que
 * BaseInput). Valor vacío = "sin selección".
 */
const model = defineModel<string>({ default: '' });

withDefaults(
  defineProps<{
    id: string;
    label: string;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    error?: string | null;
    disabled?: boolean;
  }>(),
  { placeholder: 'Selecciona una opción', required: false, error: null, disabled: false },
);
</script>

<template>
  <div class="form-group">
    <label :for="id" class="form-label">
      {{ label }}
      <span v-if="required" aria-hidden="true">*</span>
    </label>
    <select
      :id="id"
      v-model="model"
      class="form-select"
      :class="{ 'form-select-error': error }"
      :required="required"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
    >
      <option value="">
        {{ placeholder }}
      </option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
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

.form-select {
  padding: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: white;
  color: var(--color-text);
}

.form-select:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}

.form-select-error {
  border-color: var(--color-danger);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: 0.875rem;
}
</style>
