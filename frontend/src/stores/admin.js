import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useAdminStore = defineStore('admin', () => {
  const authenticated = ref(!!localStorage.getItem('admin_token'));
  const stats = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function login(token) {
    loading.value = true;
    error.value = null;
    try {
      stats.value = await api.admin.login(token);
      authenticated.value = true;
    } catch (e) {
      localStorage.removeItem('admin_token');
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    api.admin.logout();
    authenticated.value = false;
    stats.value = null;
  }

  async function fetchStats() {
    try {
      stats.value = await api.admin.stats();
    } catch {
      logout();
    }
  }

  return { authenticated, stats, loading, error, login, logout, fetchStats };
});
