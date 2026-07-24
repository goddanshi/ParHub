<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const checking = ref(false);

async function recheck() {
  checking.value = true;
  await authStore.authenticate();
  checking.value = false;
}
</script>

<template>
  <div class="wall">
    <div class="wall__card">
      <div class="wall__icon">📢</div>
      <h2 class="wall__title">Подпишитесь на канал</h2>
      <p class="wall__text">
        Чтобы пользоваться магазином, необходимо быть подписчиком нашего Telegram-канала
      </p>

      <a
        :href="authStore.channelUrl || 'https://t.me/parhubopt'"
        target="_blank"
        class="btn btn--primary wall__btn"
      >
        Подписаться на канал
      </a>

      <button
        class="btn btn--ghost wall__check-btn"
        :disabled="checking"
        @click="recheck"
      >
        {{ checking ? 'Проверяем...' : 'Я подписался ✓' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.wall {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 9999;
}

.wall__card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  max-width: 340px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.wall__icon {
  font-size: 52px;
  line-height: 1;
}

.wall__title {
  font-size: 20px;
  font-weight: 800;
  margin: 0;
}

.wall__text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.wall__btn {
  width: 100%;
  text-decoration: none;
  display: block;
}

.wall__check-btn {
  width: 100%;
  font-size: 14px;
}
</style>
