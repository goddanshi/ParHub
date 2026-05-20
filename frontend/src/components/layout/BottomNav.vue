<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTabsStore } from '@/stores/tabs';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const tabsStore = useTabsStore();
const cartStore = useCartStore();

const activeTab = computed(() => route.path);

function isActive(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabsStore.tabs"
      :key="tab.id"
      :to="tab.path"
      class="bottom-nav__item"
      :class="{ 'bottom-nav__item--active': isActive(tab.path) }"
    >
      <span v-if="tab.icon === 'cart' && cartStore.count" class="bottom-nav__badge">{{ cartStore.count }}</span>

      <svg v-if="tab.icon === 'home'" class="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
      <svg v-else-if="tab.icon === 'grid'" class="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <svg v-else-if="tab.icon === 'wheel'" class="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v10l7 7" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      </svg>
      <svg v-else-if="tab.icon === 'cart'" class="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 01-8 0" />
      </svg>
      <svg v-else class="bottom-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
      <span class="bottom-nav__label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: calc(var(--nav-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
  z-index: 100;
}

.bottom-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-muted);
  transition: color 0.2s;
  position: relative;
  -webkit-tap-highlight-color: transparent;
}

.bottom-nav__item--active {
  color: var(--accent);
}

.bottom-nav__icon {
  width: 22px;
  height: 22px;
}

.bottom-nav__label {
  font-size: 10px;
  font-weight: 600;
}

.bottom-nav__badge {
  position: absolute;
  top: 6px;
  right: calc(50% - 22px);
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
