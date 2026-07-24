import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/api/client';

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref([]);
  const loading = ref(false);

  async function fetchTabs() {
    loading.value = true;
    try {
      tabs.value = await api.tabs.list();
    } catch {
      tabs.value = [
        { id: 'home', label: 'Главная', icon: 'home', path: '/' },
        { id: 'catalog', label: 'Каталог', icon: 'grid', path: '/catalog' },
        { id: 'wheel', label: 'Рулетка', icon: 'wheel', path: '/wheel' },
        { id: 'profile', label: 'Профиль', icon: 'user', path: '/profile' },
      ];
    } finally {
      loading.value = false;
    }
  }

  return { tabs, loading, fetchTabs };
});
