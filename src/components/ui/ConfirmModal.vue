<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const open = defineModel<boolean>({
  default: false,
});

interface Props {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

withDefaults(
  defineProps<Props>(),
  {
    title: 'Confirmar acción',
    message: '¿Estás seguro de continuar?',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    loading: false,
  }
);

const emit = defineEmits<{
  confirm: [];
}>();

function close() {
  open.value = false;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    close();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div
    v-if="open"
    class="modal-overlay"
    @click.self="close"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <h2
        id="confirm-modal-title"
        class="modal-title"
      >
        {{ title }}
      </h2>

      <p class="modal-message">
        {{ message }}
      </p>

      <div class="modal-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="loading"
          @click="close"
        >
          {{ cancelText }}
        </button>

        <button
          type="button"
          class="btn btn-danger"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? 'Procesando...' : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(0 0 0 / 50%);
}

.modal {
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  background: #fff;
  box-shadow: var(--shadow-md);
}

.modal-title {
  margin: 0 0 .5rem;
  font-size: 1.25rem;
}

.modal-message {
  margin: 0 0 1.5rem;
  color: var(--color-text-secondary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: .75rem;
}

.btn {
  padding: .6rem 1.1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.btn-secondary {
  border-color: var(--color-border);
  background: #fff;
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
}
</style>

//El modal se cierra con la tecla Escape o al hacer clic fuera. 
//Quien lo use controla si se muestra con v-model y ejecuta el borrado en el evento @confirm