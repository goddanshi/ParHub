<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useTabsStore } from '@/stores/tabs';
import { useProductsStore } from '@/stores/products';
import { useTelegram } from '@/composables/useTelegram';
import AppHeader from '@/components/layout/AppHeader.vue';
import BottomNav from '@/components/layout/BottomNav.vue';
import SubscriptionWall from '@/components/SubscriptionWall.vue';

const route = useRoute();
const authStore = useAuthStore();
const tabsStore = useTabsStore();
const productsStore = useProductsStore();
useTelegram();

const isAdmin = computed(() => route.path.startsWith('/admin'));
const showNav = computed(() => !isAdmin.value);

onMounted(() => {
  if (!route.path.startsWith('/admin')) {
    authStore.authenticate();
    tabsStore.fetchTabs();
    productsStore.fetchCategories();
  }
});
</script>

<template>
  <div v-if="isAdmin" class="admin-wrapper">
    <router-view />
  </div>
  <div v-else class="app">
    <SubscriptionWall v-if="!authStore.loading && !authStore.subscribed" />
    <template v-else>
      <AppHeader />
      <main class="app-main">
        <router-view />
      </main>
      <BottomNav v-if="showNav" />
    </template>
  </div>
</template>

<style scoped>
.admin-wrapper {
  height: 100%;
  overflow: hidden;
}

.app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
