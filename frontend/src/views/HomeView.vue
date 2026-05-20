<script setup>
import { ref, onMounted } from 'vue';
import { useProductsStore } from '@/stores/products';
import ProductGrid from '@/components/products/ProductGrid.vue';
import ShopLogo from '@/components/brand/ShopLogo.vue';
import CategoryFilter from '@/components/products/CategoryFilter.vue';

const store = useProductsStore();
const featured = ref([]);

onMounted(async () => {
  await store.fetchCategories();
  await store.fetchProducts();
  featured.value = store.products.slice(0, 4);
});
</script>

<template>
  <div class="page">
    <div class="page-content">
      <section class="hero">
        <div class="hero__content">
          <p class="hero__label"><ShopLogo size="lg" /></p>
          <h1 class="hero__title">Жидкости, поды<br />и запчасти</h1>
          <router-link to="/catalog" class="btn btn--primary hero__btn">
            Смотреть каталог
          </router-link>
        </div>
        <div class="hero__glow" />
      </section>

      <section>
        <h2 class="section-title">Категории</h2>
        <CategoryFilter
          :categories="store.categories"
          active-category="all"
          @select="(id) => $router.push({ path: '/catalog', query: { category: id } })"
        />
      </section>

      <section>
        <div class="section-header">
          <h2 class="section-title">Популярное</h2>
          <router-link to="/catalog" class="section-link">Все →</router-link>
        </div>
        <ProductGrid :products="featured" :loading="store.loading" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  margin: 16px;
  padding: 28px 24px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #1a1a1a 0%, #111 100%);
  border: 1px solid var(--border);
  overflow: hidden;
}

.hero__glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 160px;
  height: 160px;
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  pointer-events: none;
}

.hero__label {
  margin-bottom: 12px;
}

.hero__title {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
}

.hero__btn {
  font-size: 14px;
  padding: 10px 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 16px;
}

.section-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
</style>
