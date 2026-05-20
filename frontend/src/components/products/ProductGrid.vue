<script setup>
import ProductCard from './ProductCard.vue';

defineProps({
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});
</script>

<template>
  <div class="product-grid">
    <template v-if="loading">
      <div v-for="i in 6" :key="i" class="product-grid__skeleton">
        <div class="skeleton" style="aspect-ratio: 1" />
        <div class="skeleton" style="height: 14px; margin-top: 10px; width: 80%" />
        <div class="skeleton" style="height: 14px; margin-top: 6px; width: 50%" />
      </div>
    </template>
    <template v-else-if="products.length">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </template>
    <div v-else class="product-grid__empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <p>Товары не найдены</p>
    </div>
  </div>
</template>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
}

.product-grid__skeleton {
  display: flex;
  flex-direction: column;
}

.product-grid__empty {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--text-muted);
  font-size: 14px;
}
</style>
