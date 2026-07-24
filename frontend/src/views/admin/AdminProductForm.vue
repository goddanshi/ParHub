<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api/client';
import { useAbortableLoad } from '@/composables/useAbortableLoad';

const route = useRoute();
const router = useRouter();
const isNew = computed(() => route.name === 'admin-product-new');
const categories = ref([]);
const saving = ref(false);
const { loading, error, run } = useAbortableLoad();

const form = ref(getEmptyForm());

function getEmptyForm() {
  return {
    name: '',
    description: '',
    fullDescription: '',
    price: 0,
    oldPrice: null,
    categoryId: '',
    image: '',
    images: '',
    features: '',
    specifications: '',
    rating: 5,
    inStock: true,
    badge: '',
  };
}

function normalizeProduct(product) {
  const allImages = Array.isArray(product.images) ? product.images : [];
  // Дополнительные фото = все кроме основного
  const extraImages = allImages.filter(url => url !== product.image);

  const features = Array.isArray(product.features)
    ? product.features
    : typeof product.features === 'string' ? [product.features] : [];

  const specs =
    product.specifications && typeof product.specifications === 'object'
      ? product.specifications
      : {};

  return {
    ...getEmptyForm(),
    ...product,
    images: extraImages.join('\n'),
    features: features.join('\n'),
    specifications: Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join('\n'),
    badge: product.badge || '',
  };
}

function loadProduct() {
  run(async (isStale) => {
    const cats = await api.admin.categories.list();
    if (isStale()) return;
    categories.value = cats;

    if (isNew.value) {
      form.value = getEmptyForm();
      if (cats.length) form.value.categoryId = cats[0].id;
      return;
    }

    const id = Number(route.params.id);
    if (!id || Number.isNaN(id)) {
      throw new Error('Некорректный ID товара');
    }

    const product = await api.admin.products.get(id);
    if (isStale()) return;
    form.value = normalizeProduct(product);
  });
}

function parseList(str) {
  if (!str) return [];
  return String(str).split('\n').map((s) => s.trim()).filter(Boolean);
}

function parseSpecs(str) {
  const specs = {};
  parseList(str).forEach((line) => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) specs[key.trim()] = rest.join(':').trim();
  });
  return specs;
}

async function save() {
  saving.value = true;
  const extraImages = parseList(form.value.images);
  const mainImage = form.value.image || null;
  const payload = {
    name: form.value.name,
    description: form.value.description,
    fullDescription: form.value.fullDescription,
    price: Number(form.value.price),
    oldPrice: form.value.oldPrice ? Number(form.value.oldPrice) : null,
    categoryId: form.value.categoryId,
    image: mainImage,
    images: mainImage ? [mainImage, ...extraImages] : extraImages,
    features: parseList(form.value.features),
    specifications: parseSpecs(form.value.specifications),
    rating: Number(form.value.rating),
    inStock: form.value.inStock,
    badge: form.value.badge || null,
  };

  try {
    if (isNew.value) {
      await api.admin.products.create(payload);
    } else {
      await api.admin.products.update(route.params.id, payload);
    }
    router.push('/admin/products');
  } catch (e) {
    alert(e.message);
  } finally {
    saving.value = false;
  }
}

watch(() => route.params.id ?? 'new', loadProduct, { immediate: true });
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">{{ isNew ? 'Новый товар' : 'Редактирование' }}</h1>
      <router-link to="/admin/products" class="admin-btn admin-btn--ghost">← Назад</router-link>
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state">
        <div class="admin-spinner" />
        <span>Загрузка товара...</span>
      </div>
    </div>

    <div v-else-if="error" class="admin-card">
      <div class="admin-state">
        <p class="admin-error">{{ error }}</p>
        <button class="admin-btn admin-btn--primary" @click="loadProduct">Повторить</button>
        <router-link to="/admin/products" class="admin-btn admin-btn--ghost">К списку</router-link>
      </div>
    </div>

    <div v-else class="admin-card admin-form-card">
      <div class="admin-form-group">
        <label>Название *</label>
        <input v-model="form.name" class="admin-input" />
      </div>
      <div class="admin-form-group">
        <label>Краткое описание</label>
        <input v-model="form.description" class="admin-input" />
      </div>
      <div class="admin-form-group">
        <label>Полное описание</label>
        <textarea v-model="form.fullDescription" class="admin-textarea" rows="4" />
      </div>
      <div class="admin-form-grid admin-form-grid--2">
        <div class="admin-form-group">
          <label>Цена *</label>
          <input v-model.number="form.price" type="number" class="admin-input" />
        </div>
        <div class="admin-form-group">
          <label>Старая цена</label>
          <input v-model.number="form.oldPrice" type="number" class="admin-input" />
        </div>
      </div>
      <div class="admin-form-group">
        <label>Категория *</label>
        <select v-model="form.categoryId" class="admin-select">
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div v-if="form.image" class="admin-form-group">
        <label>Основное фото (из МойСклад)</label>
        <img :src="form.image" class="admin-main-img-preview" alt="" />
      </div>

      <div class="admin-form-group">
        <label>Дополнительные фото (по одному на строку)</label>
        <textarea v-model="form.images" class="admin-textarea" placeholder="https://..." rows="3" />
      </div>
      <div class="admin-form-group">
        <label>Особенности (по одной на строку)</label>
        <textarea v-model="form.features" class="admin-textarea" rows="3" />
      </div>
      <div class="admin-form-group">
        <label>Характеристики (Ключ: Значение)</label>
        <textarea v-model="form.specifications" class="admin-textarea" rows="3" />
      </div>
      <div class="admin-form-grid admin-form-grid--3">
        <div class="admin-form-group">
          <label>Рейтинг</label>
          <input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" class="admin-input" />
        </div>
        <div class="admin-form-group">
          <label>Бейдж</label>
          <select v-model="form.badge" class="admin-select">
            <option value="">Нет</option>
            <option value="Хит">Хит</option>
            <option value="New">New</option>
            <option value="Sale">Sale</option>
          </select>
        </div>
        <div class="admin-form-group">
          <label class="admin-checkbox-label">
            <input v-model="form.inStock" type="checkbox" />
            В наличии
          </label>
        </div>
      </div>

      <div class="admin-actions" style="margin-top: 24px">
        <button class="admin-btn admin-btn--primary" :disabled="saving" @click="save">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
        <router-link to="/admin/products" class="admin-btn admin-btn--ghost">Отмена</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-form-card {
  max-width: 800px;
}

.admin-main-img-preview {
  display: block;
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid #333;
  background: #111;
  margin-top: 6px;
}

.admin-checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  font-size: 14px;
  color: #ccc;
  cursor: pointer;
}
</style>
