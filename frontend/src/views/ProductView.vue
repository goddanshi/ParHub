<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';
import { useCartStore } from '@/stores/cart';
import { useTelegram } from '@/composables/useTelegram';
import { useAbortableLoad } from '@/composables/useAbortableLoad';

const route = useRoute();
const cart = useCartStore();
const { haptic } = useTelegram();
const { loading, error, run } = useAbortableLoad();

const product = ref(null);
const activeImage = ref(0);
const added = ref(false);

const gallery = computed(() => {
  if (!product.value) return [];
  const imgs = product.value.images;
  if (Array.isArray(imgs) && imgs.length) return imgs;
  return product.value.image ? [product.value.image] : [];
});

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function badgeClass(badge) {
  if (badge === 'Sale') return 'badge--sale';
  if (badge === 'New') return 'badge--new';
  return 'badge--accent';
}

function addToCart() {
  if (!product.value?.inStock) return;
  cart.add(product.value);
  added.value = true;
  haptic('medium');
  setTimeout(() => { added.value = false; }, 2000);
}

function fetchProduct() {
  const id = route.params.id;

  run(async (isStale) => {
    if (!id) throw new Error('Товар не найден');

    activeImage.value = 0;
    const data = await api.products.get(id);

    if (isStale()) return;
    product.value = data;
  });
}

watch(() => route.params.id, fetchProduct, { immediate: true });
</script>

<template>
  <div class="page product-page">
    <div v-if="loading" class="page-content">
      <div class="skeleton" style="aspect-ratio: 1; margin: 16px; border-radius: 16px" />
      <div class="skeleton" style="height: 24px; margin: 16px; width: 70%" />
      <div class="skeleton" style="height: 16px; margin: 0 16px; width: 40%" />
    </div>

    <div v-else-if="error" class="page-content product-error">
      <p>{{ error }}</p>
      <button class="btn btn--primary" @click="fetchProduct">Повторить</button>
      <router-link to="/catalog" class="btn btn--ghost">В каталог</router-link>
    </div>

    <template v-else-if="product">
      <div class="page-content">
        <div class="product-gallery">
          <div class="product-image-wrap">
            <img
              :src="gallery[activeImage]"
              :alt="product.name"
              class="product-image"
            />
            <span v-if="product.badge" class="badge product-badge" :class="badgeClass(product.badge)">
              {{ product.badge }}
            </span>
          </div>
          <div v-if="gallery.length > 1" class="product-thumbs">
            <button
              v-for="(img, i) in gallery"
              :key="i"
              class="product-thumb"
              :class="{ 'product-thumb--active': activeImage === i }"
              @click="activeImage = i"
            >
              <img :src="img" :alt="`${product.name} ${i + 1}`" loading="lazy" />
            </button>
          </div>
        </div>

        <div class="product-details">
          <h1 class="product-name">{{ product.name }}</h1>

          <div class="product-meta">
            <div class="product-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span>{{ product.rating }}</span>
            </div>
            <span class="product-stock" :class="{ 'product-stock--out': !product.inStock }">
              {{ product.inStock ? 'В наличии' : 'Нет в наличии' }}
            </span>
          </div>

          <div class="product-prices">
            <span class="product-price">{{ formatPrice(product.price) }}</span>
            <span v-if="product.oldPrice" class="product-old-price">{{ formatPrice(product.oldPrice) }}</span>
            <span v-if="product.oldPrice" class="product-discount">
              -{{ Math.round((1 - product.price / product.oldPrice) * 100) }}%
            </span>
          </div>

          <p class="product-description">{{ product.description }}</p>

          <div v-if="product.features?.length" class="product-section">
            <h3 class="product-section__title">Особенности</h3>
            <div class="product-features">
              <span v-for="f in product.features" :key="f" class="product-feature">{{ f }}</span>
            </div>
          </div>

          <div v-if="product.fullDescription" class="product-section">
            <h3 class="product-section__title">Описание</h3>
            <p class="product-full-desc">{{ product.fullDescription }}</p>
          </div>

          <div
            v-if="product.specifications && Object.keys(product.specifications).length"
            class="product-section"
          >
            <h3 class="product-section__title">Характеристики</h3>
            <dl class="product-specs">
              <template v-for="(val, key) in product.specifications" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ val }}</dd>
              </template>
            </dl>
          </div>
        </div>
      </div>

      <div class="product-actions">
        <button
          class="btn btn--primary btn--block"
          :class="{ 'btn--success': added }"
          :disabled="!product.inStock"
          @click="addToCart"
        >
          {{ added ? '✓ Добавлено' : product.inStock ? 'В корзину' : 'Недоступно' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.product-page .page-content {
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + 80px);
}

.product-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px;
  text-align: center;
  color: var(--text-secondary);
}

.product-gallery {
  margin: 16px 16px 0;
}

.product-image-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-card);
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.product-badge {
  position: absolute;
  top: 12px;
  left: 12px;
}

.product-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  overflow-x: auto;
}

.product-thumb {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 2px solid transparent;
  flex-shrink: 0;
  opacity: 0.6;
}

.product-thumb--active {
  border-color: var(--accent);
  opacity: 1;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  padding: 16px;
}

.product-name {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.3;
  margin-bottom: 10px;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.product-stock {
  font-size: 13px;
  color: var(--success);
  font-weight: 600;
}

.product-stock--out {
  color: var(--danger);
}

.product-prices {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
}

.product-price {
  font-size: 28px;
  font-weight: 800;
  color: var(--accent);
}

.product-old-price {
  font-size: 16px;
  color: var(--text-muted);
  text-decoration: line-through;
}

.product-discount {
  font-size: 13px;
  font-weight: 700;
  color: var(--danger);
  background: rgba(255, 68, 68, 0.15);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.product-description {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.product-section {
  margin-bottom: 20px;
}

.product-section__title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}

.product-features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-feature {
  padding: 6px 12px;
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.product-full-desc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.product-specs {
  display: grid;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.product-specs dt,
.product-specs dd {
  padding: 10px 14px;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light);
}

.product-specs dt {
  background: var(--bg-card);
  color: var(--text-muted);
  font-weight: 600;
}

.product-specs dd {
  background: var(--bg-secondary);
}

.product-actions {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  padding: 12px 16px;
  background: linear-gradient(transparent, var(--bg-primary) 20%, var(--bg-primary));
  z-index: 40;
}

.btn--success {
  background: var(--success) !important;
  color: #fff !important;
}
</style>
