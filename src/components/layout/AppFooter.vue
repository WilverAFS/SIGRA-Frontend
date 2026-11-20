<script setup lang="ts">
import logo from '@/assets/sigra-icono.webp';
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <img
        :src="logo"
        alt="Logo de SIGRA"
        class="footer-logo"
      >

      <div class="footer-text">
        <strong>SIGRA</strong>

        <span>
          Sistema de Gestión de Recursos Académicos
        </span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: 1rem;
  border-top: 1px solid var(--color-border);
  background-color: white;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
}

.footer-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.footer-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.footer-text strong {
  line-height: 1.1;
}

.footer-text span {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-text {
    align-items: center;
  }
}
</style>