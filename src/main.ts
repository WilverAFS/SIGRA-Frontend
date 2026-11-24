import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import { useAuthStore } from '@/stores/auth';

import '@/assets/styles/variables.css';
import '@/assets/styles/breakpoints.css';
import '@/assets/styles/states.css';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

window.addEventListener('sigra:session-expired', () => {
  const authStore = useAuthStore(pinia);

  authStore.clearSession();

  if (router.currentRoute.value.path !== '/login') {
    router.replace('/login');
  }
});

app.use(router);

app.mount('#app');
