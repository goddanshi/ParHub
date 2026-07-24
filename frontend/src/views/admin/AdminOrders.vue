<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/api/client';

const route = useRoute();
const orders = ref([]);
const loading = ref(false);
const error = ref('');
const minAmount = ref(10000);

const STATUS_LABELS = {
  new:       { label: 'Новая',     color: '#4a9eff' },
  confirmed: { label: 'Подтверждена', color: '#ff9000' },
  completed: { label: 'Выполнена', color: '#4caf50' },
  cancelled: { label: 'Отменена',  color: '#ff6b6b' },
};

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [ordersData, wheelData] = await Promise.all([
      api.admin.orders.list(),
      api.admin.wheel.get().catch(() => null),
    ]);
    orders.value = ordersData;
    if (wheelData?.minPurchaseAmount) minAmount.value = wheelData.minPurchaseAmount;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function setStatus(order, status) {
  try {
    await api.admin.orders.setStatus(order.id, status);
    order.status = status;
  } catch (e) {
    alert(e.message);
  }
}

async function remove(order) {
  if (!confirm(`Удалить заказ #${order.id.slice(0, 8)}?`)) return;
  try {
    await api.admin.orders.delete(order.id);
    orders.value = orders.value.filter(o => o.id !== order.id);
  } catch (e) {
    alert(e.message);
  }
}

async function sendToMs(order) {
  try {
    const res = await api.admin.orders.sendToMs(order.id);
    order.msOrderId = res.msOrderId;
    alert('Отправлено в МойСклад!');
  } catch (e) {
    alert('Ошибка: ' + e.message);
  }
}

function formatDate(dt) {
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}

function userName(order) {
  if (order.userName) return order.userName;
  if (order.userUsername) return '@' + order.userUsername;
  return 'ID ' + order.userId;
}

watch(() => route.name, (n) => { if (n === 'admin-orders') load(); }, { immediate: true });
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">Заявки</h1>
      <button class="admin-btn admin-btn--ghost" @click="load">Обновить</button>
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state"><div class="admin-spinner" /><span>Загрузка...</span></div>
    </div>

    <div v-else-if="error" class="admin-card">
      <div class="admin-state"><p class="admin-error">{{ error }}</p></div>
    </div>

    <div v-else-if="!orders.length" class="admin-card">
      <div class="admin-state"><p class="admin-empty">Заявок пока нет</p></div>
    </div>

    <div v-else class="orders-list">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card admin-card"
        :class="{ 'order-card--priority': order.total >= minAmount && order.status === 'new' }"
      >
        <div class="order-card__head">
          <div class="order-card__meta">
            <span class="order-card__id">#{{ order.id.slice(0, 8) }}</span>
            <span class="order-card__date">{{ formatDate(order.createdAt) }}</span>
            <span class="order-card__user">{{ userName(order) }}</span>
          </div>
          <div class="order-card__right">
            <span class="order-card__total">{{ formatPrice(order.total) }}</span>
            <span v-if="order.total >= minAmount" class="order-badge order-badge--ticket">🎫 билет</span>
            <span v-if="order.msOrderId" class="order-badge order-badge--ms" title="Отправлено в МойСклад">МС ✓</span>
          </div>
        </div>

        <div class="order-items">
          <div v-for="item in order.items" :key="item.productId" class="order-item">
            <img v-if="item.image" :src="item.image" class="order-item__img" alt="" />
            <span class="order-item__name">{{ item.name }}</span>
            <span class="order-item__qty">× {{ item.quantity }}</span>
            <span class="order-item__price">{{ formatPrice(item.price * item.quantity) }}</span>
          </div>
        </div>

        <div class="order-card__foot">
          <select
            class="order-status-select"
            :value="order.status"
            :style="{ color: STATUS_LABELS[order.status]?.color || '#ccc' }"
            @change="setStatus(order, $event.target.value)"
          >
            <option v-for="(s, key) in STATUS_LABELS" :key="key" :value="key">
              {{ s.label }}
            </option>
          </select>

          <button
            v-if="!order.msOrderId"
            class="admin-btn admin-btn--ghost admin-btn--sm"
            @click="sendToMs(order)"
          >
            → МойСклад
          </button>
          <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(order)">
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  padding: 16px;
}

.order-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 12px;
}

.order-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.order-card__id {
  font-family: monospace;
  font-size: 13px;
  color: var(--accent);
  font-weight: 700;
}

.order-card__date {
  font-size: 12px;
  color: #888;
}

.order-card__user {
  font-size: 13px;
  color: #ccc;
}

.order-card__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.order-card__total {
  font-size: 16px;
  font-weight: 800;
  color: var(--accent);
}

.order-card--priority {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}

.order-badge--ticket {
  font-size: 11px;
  background: rgba(255, 144, 0, 0.15);
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 2px 6px;
}

.order-badge--ms {
  font-size: 11px;
  background: #1a3a1a;
  color: #4caf50;
  border: 1px solid #4caf50;
  border-radius: 4px;
  padding: 2px 6px;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 10px;
  background: #111;
  border-radius: 8px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.order-item__img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border-radius: 4px;
  flex-shrink: 0;
  background: #1a1a1a;
}

.order-item__name {
  flex: 1;
  color: #ddd;
}

.order-item__qty {
  color: #888;
  flex-shrink: 0;
}

.order-item__price {
  font-weight: 600;
  flex-shrink: 0;
  min-width: 80px;
  text-align: right;
}

.order-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.order-status-select {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.order-status-select option {
  color: #fff;
}
</style>
