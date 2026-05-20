<script setup>
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/client';
import { useAbortableLoad } from '@/composables/useAbortableLoad';

const route = useRoute();
const router = useRouter();
const products = ref([]);
const categories = ref([]);
const { loading, error, run } = useAbortableLoad();

function categoryName(id) {
  return categories.value.find((c) => c.id === id)?.name || id;
}

function loadProducts() {
  run(async (isStale) => {
    const [productsData, categoriesData] = await Promise.all([
      api.admin.products.list(),
      api.admin.categories.list(),
    ]);
    if (isStale()) return;
    products.value = Array.isArray(productsData) ? productsData : [];
    categories.value = Array.isArray(categoriesData) ? categoriesData : [];
  });
}

async function remove(id) {
  if (!confirm('Удалить товар?')) return;
  try {
    await api.admin.products.delete(id);
    loadProducts();
  } catch (e) {
    alert(e.message);
  }
}

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

function onImgError(e) {
  e.target.style.display = 'none';
}

watch(() => route.name, (name) => {
  if (name === 'admin-products') loadProducts();
}, { immediate: true });
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">Товары</h1>
      <router-link to="/admin/products/new" class="admin-btn admin-btn--primary">
        + Добавить товар
      </router-link>
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state">
        <div class="admin-spinner" />
        <span>Загрузка товаров...</span>
      </div>
    </div>

    <div v-else-if="error" class="admin-card">
      <div class="admin-state">
        <p class="admin-error">{{ error }}</p>
        <button class="admin-btn admin-btn--primary" @click="loadProducts">Повторить</button>
      </div>
    </div>

    <template v-else>
      <div v-if="!products.length" class="admin-card">
        <div class="admin-state">
          <p class="admin-empty">Товаров пока нет</p>
          <router-link to="/admin/products/new" class="admin-btn admin-btn--primary">
            Добавить первый товар
          </router-link>
        </div>
      </div>

      <template v-else>
        <div class="admin-card admin-card--flush">
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Фото</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Цена</th>
                  <th>Наличие</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in products" :key="p.id">
                  <td>
                    <img
                      v-if="p.image"
                      :src="p.image"
                      class="admin-table__img"
                      loading="lazy"
                      alt=""
                      @error="onImgError"
                    />
                  </td>
                  <td><strong>{{ p.name }}</strong></td>
                  <td>{{ categoryName(p.categoryId) }}</td>
                  <td>{{ formatPrice(p.price) }}</td>
                  <td>
                    <span :style="{ color: p.inStock ? '#4caf50' : '#ff6b6b' }">
                      {{ p.inStock ? 'В наличии' : 'Нет' }}
                    </span>
                  </td>
                  <td>
                    <div class="admin-actions">
                      <button
                        class="admin-btn admin-btn--ghost admin-btn--sm"
                        @click="router.push(`/admin/products/${p.id}`)"
                      >
                        Изменить
                      </button>
                      <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(p.id)">
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="admin-product-cards">
          <div v-for="p in products" :key="p.id" class="admin-product-card">
            <img
              v-if="p.image"
              :src="p.image"
              class="admin-product-card__img"
              loading="lazy"
              alt=""
              @error="onImgError"
            />
            <div class="admin-product-card__body">
              <div class="admin-product-card__name">{{ p.name }}</div>
              <div class="admin-product-card__meta">
                {{ categoryName(p.categoryId) }} · {{ p.inStock ? 'В наличии' : 'Нет' }}
              </div>
              <div class="admin-product-card__price">{{ formatPrice(p.price) }}</div>
              <div class="admin-product-card__actions">
                <button
                  class="admin-btn admin-btn--ghost admin-btn--sm"
                  @click="router.push(`/admin/products/${p.id}`)"
                >
                  Изменить
                </button>
                <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(p.id)">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
