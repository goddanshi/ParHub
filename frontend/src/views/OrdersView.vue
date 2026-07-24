<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';

const router = useRouter();
const orders = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const profile = await api.users.me();
    orders.value = profile.orders || [];
  } catch {
    orders.value = [];
  } finally {
    loading.value = false;
  }
});

const STATUS_LABELS = {
  new:       { label: 'Новая',        color: '#4a9eff' },
  confirmed: { label: 'Подтверждена', color: '#ff9000' },
  completed: { label: 'Выполнена',    color: '#4caf50' },
  cancelled: { label: 'Отменена',     color: '#ff6b6b' },
};

function formatDate(dt) {
  return new Date(dt).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatPrice(p) {
  return new Intl.NumberFormat('ru-RU').format(p) + ' ₽';
}
</script>

<template>
  <div class="page">
    <div class="page-content">
      <div class="orders-header">
        <button class="orders-back" @click="router.back()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 class="orders-title">Мои заказы</h1>
      </div>

      <div v-if="loading" class="orders-state">
        <div class="spinner" />
      </div>

      <div v-else-if="!orders.length" class="orders-state">
        <p class="orders-empty">У вас пока нет заказов</p>
        <button class="btn btn--primary" @click="router.push('/')">Перейти в магазин</button>
      </div>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card">
          <div class="order-card__head">
            <span class="order-card__id">#{{ order.id.slice(0, 8) }}</span>
            <span
              class="order-card__status"
              :style="{ color: STATUS_LABELS[order.status]?.color || '#888' }"
            >
              {{ STATUS_LABELS[order.status]?.label || order.status }}
            </span>
          </div>

          <div class="order-items">
            <div v-for="item in order.items" :key="item.productId" class="order-item">
              <!-- <img v-if="item.image" :src="item.image" class="order-item__img" alt="" /> -->
              <div class="order-item__info">
                <span class="order-item__name">{{ item.name }}</span>
                <span class="order-item__qty">{{ item.quantity }} шт. × {{ formatPrice(item.price) }}</span>
              </div>
            </div>
          </div>

          <div class="order-card__foot">
            <span class="order-card__date">{{ formatDate(order.createdAt) }}</span>
            <span class="order-card__total">{{ formatPrice(order.total) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 8px;
}

.orders-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  flex-shrink: 0;
}

.orders-title {
  font-size: 20px;
  font-weight: 800;
}

.orders-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px;
}

.orders-empty {
  color: var(--text-secondary);
  font-size: 15px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 16px 24px;
}

.order-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.order-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px 8px;
}

.order-card__id {
  font-family: monospace;
  font-size: 13px;
  color: var(--accent);
  font-weight: 700;
}

.order-card__status {
  font-size: 12px;
  font-weight: 700;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-item__img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 6px;
  background: var(--bg-elevated);
  flex-shrink: 0;
}

.order-item__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.order-item__name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.order-item__qty {
  font-size: 12px;
  color: var(--text-secondary);
}

.order-card__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
}

.order-card__date {
  font-size: 12px;
  color: var(--text-muted);
}

.order-card__total {
  font-size: 15px;
  font-weight: 800;
  color: var(--accent);
}
</style>
