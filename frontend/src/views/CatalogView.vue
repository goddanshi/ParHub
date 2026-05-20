<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import ProductGrid from '@/components/products/ProductGrid.vue';
import CategoryFilter from '@/components/products/CategoryFilter.vue';
import SearchBar from '@/components/ui/SearchBar.vue';

const route = useRoute();
const store = useProductsStore();
const searchQuery = ref('');
const showFilters = ref(false);

const sortOptions = [
  { value: '', label: 'По умолчанию' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'rating', label: 'По рейтингу' },
];

onMounted(async () => {
  await store.fetchCategories();
  if (route.query.category) {
    store.filters.category = route.query.category;
  }
  await store.fetchProducts();
});

watch(() => route.query.category, (val) => {
  if (val) {
    store.setFilter('category', val);
  }
});

let searchTimeout;
function onSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    store.setFilter('search', val);
  }, 300);
}
</script>

<template>
  <div class="page">
    <div class="catalog-toolbar">
      <SearchBar v-model="searchQuery" @search="onSearch" />
      <button class="catalog-toolbar__filter-btn" @click="showFilters = !showFilters">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
      </button>
    </div>

    <CategoryFilter
      :categories="store.categories"
      :active-category="store.filters.category"
      @select="(id) => store.setFilter('category', id)"
    />

    <transition name="slide">
      <div v-if="showFilters" class="filters-panel">
        <div class="filters-panel__row">
          <span class="filters-panel__label">Сортировка</span>
          <div class="filters-panel__options">
            <button
              v-for="opt in sortOptions"
              :key="opt.value"
              class="filters-panel__option"
              :class="{ 'filters-panel__option--active': store.filters.sort === opt.value }"
              @click="store.setFilter('sort', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <label class="filters-panel__checkbox">
          <input
            type="checkbox"
            :checked="store.filters.inStock"
            @change="store.setFilter('inStock', $event.target.checked)"
          />
          <span>Только в наличии</span>
        </label>
        <button class="filters-panel__reset" @click="store.resetFilters(); searchQuery = ''">
          Сбросить фильтры
        </button>
      </div>
    </transition>

    <div class="page-content catalog-content">
      <p class="catalog-count">
        {{ store.products.length }} {{ store.products.length === 1 ? 'товар' : 'товаров' }}
      </p>
      <ProductGrid :products="store.products" :loading="store.loading" />
    </div>
  </div>
</template>

<style scoped>
.catalog-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 0;
}

.catalog-toolbar :deep(.search-bar) {
  flex: 1;
  margin: 0;
}

.catalog-toolbar__filter-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  flex-shrink: 0;
}

.catalog-toolbar__filter-btn:active {
  color: var(--accent);
  border-color: var(--accent);
}

.filters-panel {
  margin: 8px 16px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filters-panel__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: block;
}

.filters-panel__options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filters-panel__option {
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.filters-panel__option--active {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent);
}

.filters-panel__checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
}

.filters-panel__checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.filters-panel__reset {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
  text-align: left;
}

.catalog-content {
  padding-top: 8px;
}

.catalog-count {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-muted);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  max-height: 300px;
}
</style>
