import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const subscribed = ref(true);
  const channelUrl = ref(null);

  async function authenticate() {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.auth.verify();
      user.value = data.user;
      subscribed.value = data.subscribed !== false;
      channelUrl.value = data.channelUrl || null;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return { user, loading, error, subscribed, channelUrl, authenticate };
});
