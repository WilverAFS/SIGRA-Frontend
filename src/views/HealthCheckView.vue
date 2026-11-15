<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

interface HealthData {
  status: string;
  version: string;
  timestamp: string;
  services: {
    database: string;
    cache: string;
    queue: string;
  };
}

const loading = ref<boolean>(true);
const error = ref<string | null>(null);
const healthInfo = ref<HealthData | null>(null);

const checkHealth = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await api.get('/health');
    // El contrato de respuesta envuelve los datos en `.data`
    healthInfo.value = response.data.data;
  } catch (err: any) {
    console.error('Error al conectar con el backend:', err);
    error.value = err.message || 'No se pudo establecer conexión con el servidor backend.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  checkHealth();
});
</script>

<template>
  <div style="padding: 2rem; font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Diagnóstico de Conectividad (SIGRA)</h2>
    <p>Verificando comunicación en tiempo real con el backend mediante la URL base.</p>

    <div style="margin-top: 1.5rem;">
      <button 
        @click="checkHealth" 
        style="padding: 0.5rem 1rem; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Reintentar Conexión
      </button>
    </div>

    <!-- Estado de carga -->
    <p v-if="loading" style="margin-top: 1rem; color: #4b5563;">Conectando con el servidor...</p>

    <!-- Estado de error -->
    <div v-if="error" style="margin-top: 1rem; padding: 1rem; background-color: #fee2e2; color: #991b1b; border-radius: 4px;">
      <strong>Error de Conexión:</strong> {{ error }}
      <p style="font-size: 0.85rem; margin-top: 0.5rem;">Asegúrate de que el backend esté corriendo en <code>http://localhost:3000</code>.</p>
    </div>

    <!-- Resultado exitoso -->
    <div v-if="healthInfo" style="margin-top: 1.5rem; padding: 1rem; background-color: #d1fae5; color: #065f46; border-radius: 4px;">
      <h3 style="margin-top: 0;">¡Conexión Exitosa!</h3>
      <ul style="padding-left: 1.2rem; line-height: 1.6;">
        <li><strong>Estado del servicio:</strong> {{ healthInfo.status }}</li>
        <li><strong>Versión de la API:</strong> {{ healthInfo.version }}</li>
        <li><strong>Timestamp:</strong> {{ healthInfo.timestamp }}</li>
        <li><strong>Base de datos:</strong> {{ healthInfo.services.database }}</li>
        <li><strong>Caché (Redis):</strong> {{ healthInfo.services.cache }}</li>
        <li><strong>Cola (RabbitMQ):</strong> {{ healthInfo.services.queue }}</li>
      </ul>
    </div>
  </div>
</template>