<script setup>
import { ref, computed } from 'vue';
import { api } from '@/api/client';
import { useAbortableLoad } from '@/composables/useAbortableLoad';

const wheel = ref(null);
const products = ref([]);
const showModal = ref(false);
const editing = ref(null);
const { loading, error, run } = useAbortableLoad();

const emptyForm = () => ({
  label: '',
  description: '',
  type: 'coupon',
  couponCode: '',
  probability: 10,
  color: '#ff9000',
  image: '',
  productId: null,
});

const form = ref(emptyForm());

const totalProbability = computed(() =>
  (wheel.value?.prizes || []).reduce((s, p) => s + Number(p.probability), 0)
);

function productById(id) {
  if (id == null) return null;
  return products.value.find((p) => p.id === Number(id));
}

function loadData() {
  run(async (isStale) => {
    const [wheelData, productsData] = await Promise.all([
      api.admin.wheel.get(),
      api.admin.products.list(),
    ]);
    if (isStale()) return;
    wheel.value = wheelData;
    products.value = Array.isArray(productsData) ? productsData : [];
  });
}

async function saveSettings() {
  try {
    await api.admin.wheel.update({
      enabled: wheel.value.enabled,
      minPurchaseAmount: wheel.value.minPurchaseAmount,
    });
    alert('Настройки сохранены');
  } catch (e) {
    alert(e.message);
  }
}

function openCreate() {
  editing.value = null;
  form.value = emptyForm();
  showModal.value = true;
}

function openEdit(prize) {
  editing.value = prize;
  form.value = {
    ...emptyForm(),
    ...prize,
    productId: prize.productId != null ? Number(prize.productId) : null,
    image: prize.image || '',
  };
  showModal.value = true;
}

function selectProduct(product) {
  form.value.productId = product.id;
  form.value.label = product.name;
  form.value.image = product.image;
  form.value.type = 'product';
  if (!form.value.couponCode) {
    form.value.couponCode = `PRIZE-${product.id}`;
  }
}

function clearProduct() {
  form.value.productId = null;
}

async function savePrize() {
  try {
    const payload = {
      ...form.value,
      productId: form.value.productId != null ? Number(form.value.productId) : null,
      image: form.value.image || null,
      probability: Number(form.value.probability) || 0,
    };
    if (editing.value) {
      await api.admin.wheel.updatePrize(editing.value.id, payload);
    } else {
      await api.admin.wheel.createPrize(payload);
    }
    showModal.value = false;
    loadData();
  } catch (e) {
    alert(e.message);
  }
}

async function removePrize(id) {
  if (!confirm('Удалить приз?')) return;
  try {
    await api.admin.wheel.deletePrize(id);
    loadData();
  } catch (e) {
    alert(e.message);
  }
}

async function saveAllPrizes() {
  try {
    await api.admin.wheel.update({ prizes: wheel.value.prizes });
    alert('Вероятности сохранены');
  } catch (e) {
    alert(e.message);
  }
}

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

loadData();
</script>

<template>
  <div class="wheel-admin">
    <div class="admin-page-header">
      <h1 class="admin-page-title">Рулетка</h1>
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state">
        <div class="admin-spinner" />
        <span>Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="admin-card">
      <div class="admin-state">
        <p class="admin-error">{{ error }}</p>
        <button class="admin-btn admin-btn--primary" @click="loadData">Повторить</button>
      </div>
    </div>

    <template v-else-if="wheel">
      <div class="admin-card wheel-settings">
        <h3 class="wheel-section-title">Настройки</h3>
        <label class="wheel-checkbox">
          <input v-model="wheel.enabled" type="checkbox" />
          Рулетка включена
        </label>
        <div class="admin-form-group">
          <label>Мин. сумма покупки для билета (₽)</label>
          <input v-model.number="wheel.minPurchaseAmount" type="number" class="admin-input" />
        </div>
        <button class="admin-btn admin-btn--primary" @click="saveSettings">Сохранить настройки</button>
      </div>

      <div class="admin-page-header" style="margin-top: 8px">
        <h2 class="wheel-section-title">Призы рулетки ({{ wheel.prizes?.length || 0 }})</h2>
        <div class="admin-actions">
          <button class="admin-btn admin-btn--primary" @click="openCreate">+ Приз</button>
          <button class="admin-btn admin-btn--ghost" @click="saveAllPrizes">Сохранить %</button>
        </div>
      </div>

      <p class="wheel-prob-hint">
        Сумма вероятностей:
        <strong :class="totalProbability === 100 ? 'wheel-prob-ok' : 'wheel-prob-warn'">
          {{ totalProbability }}%
        </strong>
        (рекомендуется 100%)
      </p>

      <div v-if="!wheel.prizes?.length" class="admin-card">
        <div class="admin-state">
          <p class="admin-empty">Призов пока нет. Добавьте первый приз.</p>
        </div>
      </div>

      <div v-else class="wheel-prizes-grid">
        <div v-for="prize in wheel.prizes" :key="prize.id" class="wheel-prize-card">
          <div class="wheel-prize-card__top">
            <img
              v-if="prize.image"
              :src="prize.image"
              class="wheel-prize-card__img"
              alt=""
              @error="($event.target).style.visibility = 'hidden'"
            />
            <div
              v-else
              class="wheel-prize-card__img wheel-prize-card__img--placeholder"
              :style="{ background: prize.color }"
            />
            <input
              v-model="prize.color"
              type="color"
              class="wheel-prize-card__color"
              title="Цвет сектора"
            />
          </div>

          <div class="wheel-prize-card__body">
            <strong class="wheel-prize-card__label">{{ prize.label }}</strong>
            <p class="wheel-prize-card__desc">{{ prize.description || '—' }}</p>

            <p v-if="productById(prize.productId)" class="wheel-prize-card__product">
              📦 {{ productById(prize.productId).name }}
            </p>

            <p v-if="prize.couponCode" class="wheel-prize-card__code">
              Код: <code>{{ prize.couponCode }}</code>
            </p>

            <div class="wheel-prize-card__prob">
              <label>Вероятность %</label>
              <input
                v-model.number="prize.probability"
                type="number"
                min="0"
                max="100"
                class="admin-input"
              />
              <div class="admin-probability-bar">
                <div
                  class="admin-probability-bar__fill"
                  :style="{ width: Math.min(prize.probability, 100) + '%' }"
                />
              </div>
            </div>
          </div>

          <div class="wheel-prize-card__actions">
            <button class="admin-btn admin-btn--ghost admin-btn--sm" @click="openEdit(prize)">
              Изменить
            </button>
            <button class="admin-btn admin-btn--danger admin-btn--sm" @click="removePrize(prize.id)">
              Удалить
            </button>
          </div>
        </div>
      </div>

      <!-- Справочник: все товары магазина -->
      <div class="admin-card wheel-products-ref">
        <h3 class="wheel-section-title">
          Товары магазина ({{ products.length }}) — для привязки к призам
        </h3>
        <p class="wheel-products-ref__hint">
          При создании приза выберите товар из списка ниже — подставятся фото и название.
        </p>
        <div v-if="!products.length" class="admin-empty">Товаров нет. Добавьте в разделе «Товары».</div>
        <div v-else class="wheel-products-grid">
          <div
            v-for="p in products"
            :key="p.id"
            class="wheel-product-chip"
          >
            <img :src="p.image" :alt="p.name" @error="($event.target).src = ''" />
            <div class="wheel-product-chip__info">
              <span class="wheel-product-chip__name">{{ p.name }}</span>
              <span class="wheel-product-chip__price">{{ formatPrice(p.price) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка приза -->
    <div v-if="showModal" class="admin-modal-overlay" @click.self="showModal = false">
      <div class="admin-modal admin-modal--wide">
        <h2 class="admin-modal__title">{{ editing ? 'Редактировать приз' : 'Новый приз' }}</h2>

        <div class="admin-form-group">
          <label>Выберите товар ({{ products.length }} шт.) — клик по карточке</label>
          <div v-if="!products.length" class="admin-empty">Сначала добавьте товары в каталог</div>
          <div v-else class="wheel-product-picker">
            <button
              type="button"
              class="wheel-product-picker__item"
              :class="{ 'wheel-product-picker__item--active': form.productId === null }"
              @click="clearProduct"
            >
              <span class="wheel-product-picker__none">Без товара</span>
            </button>
            <button
              v-for="p in products"
              :key="p.id"
              type="button"
              class="wheel-product-picker__item"
              :class="{ 'wheel-product-picker__item--active': form.productId === p.id }"
              @click="selectProduct(p)"
            >
              <img :src="p.image" :alt="p.name" loading="lazy" />
              <span class="wheel-product-picker__name">{{ p.name }}</span>
              <span class="wheel-product-picker__price">{{ formatPrice(p.price) }}</span>
            </button>
          </div>
        </div>

        <div class="admin-form-grid admin-form-grid--2">
          <div class="admin-form-group">
            <label>Название на колесе *</label>
            <input v-model="form.label" class="admin-input" placeholder="Краткое название" />
          </div>
          <div class="admin-form-group">
            <label>Тип</label>
            <select v-model="form.type" class="admin-select">
              <option value="coupon">Купон</option>
              <option value="product">Товар</option>
              <option value="empty">Пусто</option>
            </select>
          </div>
        </div>

        <div class="admin-form-group">
          <label>URL картинки сектора</label>
          <input v-model="form.image" class="admin-input" placeholder="https://..." />
          <img v-if="form.image" :src="form.image" class="wheel-form-preview" alt="" />
        </div>

        <div class="admin-form-group">
          <label>Описание при выигрыше</label>
          <input v-model="form.description" class="admin-input" />
        </div>

        <div v-if="form.type !== 'empty'" class="admin-form-group">
          <label>Код купона</label>
          <input v-model="form.couponCode" class="admin-input" />
        </div>

        <div class="admin-form-grid admin-form-grid--2">
          <div class="admin-form-group">
            <label>Вероятность (%)</label>
            <input v-model.number="form.probability" type="number" min="0" max="100" class="admin-input" />
          </div>
          <div class="admin-form-group">
            <label>Цвет сектора</label>
            <input v-model="form.color" type="color" class="wheel-color-input" />
          </div>
        </div>

        <div class="admin-modal__actions">
          <button class="admin-btn admin-btn--ghost" @click="showModal = false">Отмена</button>
          <button class="admin-btn admin-btn--primary" @click="savePrize">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wheel-section-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.wheel-settings {
  max-width: 480px;
}

.wheel-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 14px;
  cursor: pointer;
}

.wheel-prob-hint {
  color: #888;
  font-size: 13px;
  margin-bottom: 16px;
}

.wheel-prob-ok {
  color: #4caf50;
}

.wheel-prob-warn {
  color: #ff9000;
}

.wheel-prizes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.wheel-prize-card {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.wheel-prize-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #0d0d0d;
}

.wheel-prize-card__img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #333;
  flex-shrink: 0;
}

.wheel-prize-card__img--placeholder {
  border-radius: 50%;
}

.wheel-prize-card__color {
  width: 36px;
  height: 36px;
  border: none;
  cursor: pointer;
  margin-left: auto;
}

.wheel-prize-card__body {
  padding: 12px 14px;
  flex: 1;
}

.wheel-prize-card__label {
  display: block;
  font-size: 15px;
  margin-bottom: 4px;
}

.wheel-prize-card__desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.wheel-prize-card__product {
  font-size: 12px;
  color: #ff9000;
  margin-bottom: 6px;
}

.wheel-prize-card__code {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 10px;
}

.wheel-prize-card__code code {
  color: #ff9000;
}

.wheel-prize-card__prob label {
  font-size: 11px;
  color: #888;
  display: block;
  margin-bottom: 4px;
}

.wheel-prize-card__actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid #2a2a2a;
}

.wheel-products-ref {
  margin-top: 8px;
}

.wheel-products-ref__hint {
  font-size: 13px;
  color: #888;
  margin-bottom: 16px;
}

.wheel-products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.wheel-product-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
}

.wheel-product-chip img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: #222;
  flex-shrink: 0;
}

.wheel-product-chip__info {
  min-width: 0;
}

.wheel-product-chip__name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wheel-product-chip__price {
  font-size: 12px;
  color: #ff9000;
}

.admin-modal--wide {
  max-width: 720px;
}

.wheel-product-picker {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  margin-bottom: 8px;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  background: #0d0d0d;
}

.wheel-product-picker__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  background: #1a1a1a;
  border: 2px solid #2a2a2a;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s, background 0.2s;
}

.wheel-product-picker__item:hover {
  border-color: #555;
}

.wheel-product-picker__item--active {
  border-color: #ff9000;
  background: rgba(255, 144, 0, 0.1);
}

.wheel-product-picker__item img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  background: #222;
}

.wheel-product-picker__none {
  font-size: 13px;
  color: #888;
  padding: 24px 8px;
}

.wheel-product-picker__name {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #eee;
}

.wheel-product-picker__price {
  font-size: 11px;
  color: #ff9000;
}

.wheel-form-preview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin-top: 10px;
  border: 2px solid #ff9000;
}

.wheel-color-input {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 600px) {
  .wheel-prizes-grid {
    grid-template-columns: 1fr;
  }

  .wheel-product-picker {
    grid-template-columns: repeat(2, 1fr);
  }

  .wheel-products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
