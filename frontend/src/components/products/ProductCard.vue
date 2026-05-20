<script setup>
defineProps({
  product: { type: Object, required: true },
});

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

function badgeClass(badge) {
  if (badge === 'Sale') return 'badge--sale';
  if (badge === 'New') return 'badge--new';
  return 'badge--accent';
}
</script>

<template>
  <router-link :to="`/product/${product.id}`" class="product-card fade-in">
    <div class="product-card__image-wrap">
      <img :src="product.image" :alt="product.name" class="product-card__image" loading="lazy" />
      <span v-if="product.badge" class="badge product-card__badge" :class="badgeClass(product.badge)">
        {{ product.badge }}
      </span>
      <span v-if="!product.inStock" class="product-card__out-of-stock">Нет в наличии</span>
    </div>
    <div class="product-card__info">
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__rating">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span>{{ product.rating }}</span>
      </div>
      <div class="product-card__prices">
        <span class="product-card__price">{{ formatPrice(product.price) }}</span>
        <span v-if="product.oldPrice" class="product-card__old-price">
          {{ formatPrice(product.oldPrice) }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.97);
}

.product-card__image-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--bg-elevated);
}

.product-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-card__badge {
  position: absolute;
  top: 8px;
  left: 8px;
}

.product-card__out-of-stock {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.product-card__info {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-card__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.product-card__prices {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 2px;
}

.product-card__price {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
}

.product-card__old-price {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: line-through;
}
</style>
