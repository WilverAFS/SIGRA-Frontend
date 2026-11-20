<script setup lang="ts">
const model = defineModel<string>({
  default: '',
});

interface Props {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

withDefaults(
  defineProps<Props>(),
  {
    type: 'text',
    placeholder: '',
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

    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :aria-invalid="Boolean(error)"
      :aria-describedby="
        error
          ? `${id}-error`
          : undefined
      "
      class="form-input"
      :class="{
        'form-input-error': error,
      }"
    >

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

.form-input {
  padding: .75rem;
  border: 1px solid #d1d5db;
  border-radius: .375rem;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
}

.form-input-error {
  border-color: #dc2626;
}

.form-error {
  margin: 0;
  color: #dc2626;
  font-size: .875rem;
}
</style>