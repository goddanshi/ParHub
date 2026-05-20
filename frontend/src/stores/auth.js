import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function authenticate() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.auth.verify();
      user.value = data.user;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { user, loading, error, authenticate };
});
