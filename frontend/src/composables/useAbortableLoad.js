import { ref } from 'vue';

export function useAbortableLoad() {
  const loading = ref(false);
  const error = ref(null);
  let requestId = 0;

  async function run(loadFn) {
    const current = ++requestId;
    loading.value = true;
    error.value = null;

    try {
      const result = await loadFn(() => current !== requestId);
      if (current !== requestId) return result;
      return result;
    } catch (e) {
      if (current !== requestId) return;
      error.value = e.message || 'Ошибка загрузки';
    } finally {
      if (current === requestId) {
        loading.value = false;
      }
    }
  }

  return { loading, error, run };
}
