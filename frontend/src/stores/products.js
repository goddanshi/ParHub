import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client';

export const useProductsStore = defineStore('products', () => {
  const products = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const filters = ref({
    category: 'all',
    search: '',
    sort: '',
    inStock: false,
  });

  const activeCategory = computed(() =>
    categories.value.find((c) => c.id === filters.value.category)
  );

  async function fetchCategories() {
    try {
      categories.value = await api.categories.list();
    } catch (e) {
      error.value = e.message;
    }
  }

  async function fetchProducts() {
    loading.value = true;
    error.value = null;
    try {
      const params = {};
      if (filters.value.category !== 'all') params.category = filters.value.category;
      if (filters.value.search) params.search = filters.value.search;
      if (filters.value.sort) params.sort = filters.value.sort;
      if (filters.value.inStock) params.inStock = 'true';
      products.value = await api.products.list(params);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value;
    fetchProducts();
  }

  function resetFilters() {
    filters.value = { category: 'all', search: '', sort: '', inStock: false };
    fetchProducts();
  }

  return {
    products,
    categories,
    loading,
    error,
    filters,
    activeCategory,
    fetchCategories,
    fetchProducts,
    setFilter,
    resetFilters,
  };
});
