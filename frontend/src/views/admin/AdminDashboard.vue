<script setup>
import { useAdminStore } from '@/stores/admin';

const admin = useAdminStore();
</script>

<template>
  <div>
    <h1 class="admin-page-title">Дашборд</h1>
    <div v-if="admin.stats" class="admin-stats">
      <div class="admin-stat">
        <div class="admin-stat__value">{{ admin.stats.products }}</div>
        <div class="admin-stat__label">Товаров</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat__value">{{ admin.stats.categories }}</div>
        <div class="admin-stat__label">Категорий</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat__value">{{ admin.stats.orders }}</div>
        <div class="admin-stat__label">Заказов</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat__value">{{ admin.stats.wheelPrizes }}</div>
        <div class="admin-stat__label">Призов</div>
      </div>
      <div class="admin-stat">
        <div class="admin-stat__value">{{ admin.stats.tickets?.used || 0 }}/{{ admin.stats.tickets?.total || 0 }}</div>
        <div class="admin-stat__label">Билетов (исп./всего)</div>
      </div>
    </div>
    <div class="admin-card">
      <h3 style="margin-bottom: 12px">Быстрые ссылки</h3>
      <div class="admin-actions">
        <router-link to="/admin/products" class="admin-btn admin-btn--primary">+ Товар</router-link>
        <router-link to="/admin/categories" class="admin-btn admin-btn--ghost">Категории</router-link>
        <router-link to="/admin/wheel" class="admin-btn admin-btn--ghost">Колесо</router-link>
        <router-link to="/admin/tabs" class="admin-btn admin-btn--ghost">Вкладки</router-link>
      </div>
    </div>
  </div>
</template>
