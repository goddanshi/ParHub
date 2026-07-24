<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client';

const router = useRouter();
const prizes = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    prizes.value = await api.wheel.prizes();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

function formatDate(dt) {
  return new Date(dt).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<template>
  <div class="page">
    <div class="page-content">
      <div class="prizes-header">
        <button class="back-btn" @click="router.back()">← Назад</button>
        <h1 class="prizes-title">Мои призы</h1>
      </div>

      <div v-if="loading" class="prizes-state">
        <div class="spinner" />
        <span>Загрузка...</span>
      </div>

      <div v-else-if="error" class="prizes-state">
        <p class="prizes-error">{{ error }}</p>
      </div>

      <div v-else-if="!prizes.length" class="prizes-empty">
        <p class="prizes-empty__icon">🎰</p>
        <p class="prizes-empty__text">У вас пока нет выигранных призов</p>
        <p class="prizes-empty__sub">Крутите рулетку, чтобы выиграть!</p>
        <button class="btn btn--primary" @click="router.push('/wheel')">Перейти к рулетке</button>
      </div>

      <div v-else class="prizes-list">
        <div v-for="entry in prizes" :key="entry.id" class="prize-card">
          <div class="prize-card__left">
            <img
              v-if="entry.prize.image"
              :src="entry.prize.image"
              class="prize-card__img"
              alt=""
            />
            <div
              v-else
              class="prize-card__dot"
              :style="{ background: entry.prize.color || '#ff9000' }"
            />
          </div>
          <div class="prize-card__body">
            <span class="prize-card__label">{{ entry.prize.label }}</span>
            <span v-if="entry.prize.description" class="prize-card__desc">{{ entry.prize.description }}</span>
            <span v-if="entry.prize.couponCode" class="prize-card__code">
              Код: <strong>{{ entry.prize.couponCode }}</strong>
            </span>
            <span class="prize-card__date">{{ formatDate(entry.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prizes-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 8px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 0;
  flex-shrink: 0;
}

.prizes-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0;
}

.prizes-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 16px;
  color: var(--text-secondary);
}

.prizes-error {
  color: #ff6b6b;
  font-size: 14px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #333;
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.prizes-empty {
  text-align: center;
  padding: 60px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.prizes-empty__icon {
  font-size: 56px;
  margin-bottom: 4px;
}

.prizes-empty__text {
  font-size: 16px;
  font-weight: 700;
}

.prizes-empty__sub {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.prizes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 16px 24px;
}

.prize-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px;
}

.prize-card__left {
  flex-shrink: 0;
}

.prize-card__img {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
}

.prize-card__dot {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--border);
}

.prize-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.prize-card__label {
  font-size: 15px;
  font-weight: 700;
}

.prize-card__desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.prize-card__code {
  font-size: 13px;
  color: #ccc;
}

.prize-card__code strong {
  color: var(--accent);
  font-family: monospace;
}

.prize-card__date {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}
</style>
