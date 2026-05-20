import { ref } from 'vue';

export function useAdminPage(loadFn) {
  const loading = ref(true);
  const error = ref(null);

  async function load() {
    loading.value = true;
    error.value = null;
    try {
      await loadFn();
    } catch (e) {
      error.value = e.message || 'Ошибка загрузки';
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, load };
}
