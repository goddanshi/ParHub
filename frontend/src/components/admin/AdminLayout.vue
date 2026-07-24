<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const admin = useAdminStore();
const router = useRouter();
const route = useRoute();
const sidebarOpen = ref(false);

const nav = [
  { path: '/admin', label: 'Дашборд', icon: '📊' },
  { path: '/admin/orders', label: 'Заявки', icon: '📋' },
  { path: '/admin/products', label: 'Товары', icon: '📦' },
  { path: '/admin/wheel', label: 'Рулетка', icon: '🎡' },
  { path: '/admin/levels', label: 'Уровни', icon: '🏆' },
  { path: '/admin/broadcast', label: 'Рассылка', icon: '📣' },
  { path: '/admin/users', label: 'Пользователи', icon: '👥' },
];

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function logout() {
  admin.logout();
  router.push('/admin/login');
}

watch(
  () => route.path,
  () => {
    closeSidebar();
    document.documentElement.classList.add('is-admin');
  },
  { immediate: true }
);

onMounted(() => {
  document.documentElement.classList.add('is-admin');
  if (!admin.authenticated) {
    router.replace('/admin/login');
  } else {
    admin.fetchStats();
  }
});

onUnmounted(() => {
  document.documentElement.classList.remove('is-admin');
});
</script>

<template>
  <div class="admin-app">
    <div v-if="sidebarOpen" class="admin-overlay" @click="closeSidebar" />

    <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': sidebarOpen }">
      <div class="admin-sidebar__head">
        <div class="admin-sidebar__logo">
          <span class="admin-sidebar__logo-icon">V</span>
          <div>
            <span class="admin-sidebar__logo-title">Vape Admin</span>
            <span class="admin-sidebar__logo-sub">Панель управления</span>
          </div>
        </div>
        <button class="admin-sidebar__close" aria-label="Закрыть" @click="closeSidebar">✕</button>
      </div>

      <nav class="admin-sidebar__nav">
        <router-link
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          class="admin-sidebar__link"
          :class="{ 'admin-sidebar__link--active': route.path === item.path || (item.path !== '/admin' && route.path.startsWith(item.path)) }"
        >
          <span class="admin-sidebar__link-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="admin-sidebar__footer">
        <button class="admin-btn admin-btn--ghost admin-btn--block" @click="logout">Выйти</button>
        <a href="/" class="admin-sidebar__shop-link">← В магазин</a>
      </div>
    </aside>

    <div class="admin-content">
      <header class="admin-topbar">
        <button class="admin-topbar__burger" aria-label="Меню" @click="toggleSidebar">
          <span /><span /><span />
        </button>
        <span class="admin-topbar__title">Админ-панель</span>
        <a href="/" class="admin-topbar__shop">Магазин</a>
      </header>

      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>
