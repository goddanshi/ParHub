<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import ShopLogo from '@/components/brand/ShopLogo.vue';

const route = useRoute();
const router = useRouter();
const cart = useCartStore();

const isProduct = computed(() => route.name === 'product');

const title = computed(() => {
  switch (route.name) {
    case 'home': return '';
    case 'catalog': return 'Каталог';
    case 'product': return 'Товар';
    case 'cart': return 'Корзина';
    case 'wheel': return 'Колесо';
    case 'profile': return 'Профиль';
    default: return '';
  }
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/catalog');
  }
}
</script>

<template>
  <header class="header">
    <div class="header__left">
      <button v-if="isProduct" class="header__back" aria-label="Назад" @click="goBack">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <router-link v-else to="/" class="header__logo">
        <ShopLogo size="sm" />
      </router-link>
      <ShopLogo v-if="isProduct" size="sm" class="header__brand" />
      <span v-else-if="title" class="header__title">{{ title }}</span>
    </div>

    <div class="header__actions">
      <router-link v-if="!isProduct" to="/catalog" class="header__btn" aria-label="Поиск">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </router-link>
      <router-link to="/cart" class="header__btn header__btn--cart" aria-label="Корзина">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <path d="M3 6h18" />
        </svg>
        <span v-if="cart.count" class="header__badge">{{ cart.count }}</span>
      </router-link>
    </div>
  </header>
</template>

<style scoped>
.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 8px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  z-index: 50;
}

.header__left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.header__back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.header__back:active {
  background: var(--bg-elevated);
}

.header__logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.header__brand {
  flex-shrink: 0;
}

.header__title {
  font-size: 18px;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.header__btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  position: relative;
}

.header__btn:active {
  background: var(--bg-elevated);
  color: var(--accent);
}

.header__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--accent);
  color: #000;
  font-size: 10px;
  font-weight: 800;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
