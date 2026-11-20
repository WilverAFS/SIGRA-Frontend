import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import '@/assets/styles/variables.css';
import '@/assets/styles/breakpoints.css';
import '@/assets/styles/states.css';
import './style.css';

const app = createApp(App);

// Registrar Pinia para la gestión de estado global
app.use(createPinia());

// Registrar Vue Router para la navegación entre vistas
app.use(router);

app.mount('#app');