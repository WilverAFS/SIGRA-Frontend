<script setup lang="ts">
import type { SelectOption } from '@/types/ui';

const model = defineModel<string | number>({
  default: '',
});

interface Props {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

withDefaults(
  defineProps<Props>(),
  {
    placeholder: 'Selecciona una opción',
    required: false,
    error: null,
    disabled: false,
  }
);
</script>

<template>
  <div class="form-group">
    <label
      :for="id"
      class="form-label"
    >
      {{ label }}

      <span v-if="required">
        *
      </span>
    </label>

    <select
      :id="id"
      v-model="model"
      :required="required"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="error ? `${id}-error` : undefined"
      class="form-select"
      :class="{ 'form-select-error': error }"
    >
      <option value="">
        {{ placeholder }}
      </option>

      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>

    <p
      v-if="error"
      :id="`${id}-error`"
      class="form-error"
    >
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  flex-direction: column;
  gap: .35rem;
}

.form-label {
  font-weight: 600;
}

.form-select {
  padding: .75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: #fff;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-select-error {
  border-color: var(--color-danger);
}

.form-error {
  margin: 0;
  color: var(--color-danger);
  font-size: .875rem;
}
</style>