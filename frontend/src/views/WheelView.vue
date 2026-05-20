<script setup>
import { ref, onMounted } from 'vue';
import { useWheelStore } from '@/stores/wheel';
import { useTelegram } from '@/composables/useTelegram';
import FortuneWheel from '@/components/wheel/FortuneWheel.vue';

const wheelStore = useWheelStore();
const { haptic } = useTelegram();

const targetIndex = ref(-1);
const showResult = ref(false);
const canSpin = ref(true);

onMounted(async () => {
  await wheelStore.fetchConfig();
  await wheelStore.fetchTickets();
});

async function handleSpin() {
  if (!canSpin.value || wheelStore.spinning || wheelStore.tickets < 1) return;

  canSpin.value = false;
  showResult.value = false;
  haptic('medium');

  try {
    const result = await wheelStore.spin();
    targetIndex.value = result.segmentIndex;
    wheelStore.spinning = true;
  } catch (e) {
    alert(e.message);
    canSpin.value = true;
  }
}

function onSpinEnd() {
  wheelStore.finishSpin();
  showResult.value = true;
  canSpin.value = true;
  haptic('heavy');
}
</script>

<template>
  <div class="page">
    <div class="page-content wheel-page">
      <div class="wheel-header">
        <h1 class="wheel-title">Колесо фортуны</h1>
        <p class="wheel-subtitle">
          При покупке от {{ (wheelStore.config?.minPurchaseAmount || 10000).toLocaleString('ru-RU') }} ₽
          вы получаете билет на прокрутку
        </p>
      </div>

      <div class="wheel-tickets">
        <span class="wheel-tickets__label">Ваши билеты</span>
        <span class="wheel-tickets__count">{{ wheelStore.tickets }}</span>
      </div>

      <FortuneWheel
        v-if="wheelStore.config?.prizes?.length"
        :prizes="wheelStore.config.prizes"
        :spinning="wheelStore.spinning"
        :target-index="targetIndex"
        @spin-end="onSpinEnd"
      />

      <button
        class="btn btn--primary btn--block wheel-spin-btn"
        :disabled="wheelStore.tickets < 1 || wheelStore.spinning"
        @click="handleSpin"
      >
        {{ wheelStore.spinning ? 'Крутим...' : wheelStore.tickets < 1 ? 'Нет билетов' : 'Крутить колесо!' }}
      </button>

      <transition name="fade">
        <div v-if="showResult && wheelStore.lastPrize" class="wheel-result">
          <img
            v-if="wheelStore.lastPrize.image"
            :src="wheelStore.lastPrize.image"
            class="wheel-result__img"
            alt=""
          />
          <p class="wheel-result__title">Поздравляем!</p>
          <p class="wheel-result__prize">{{ wheelStore.lastPrize.label }}</p>
          <p v-if="wheelStore.lastPrize.couponCode" class="wheel-result__code">
            Код: <strong>{{ wheelStore.lastPrize.couponCode }}</strong>
          </p>
          <p class="wheel-result__desc">{{ wheelStore.lastPrize.description }}</p>
        </div>
      </transition>

      <div class="wheel-prizes-list">
        <h3 class="wheel-prizes-list__title">Возможные призы</h3>
        <div
          v-for="prize in wheelStore.config?.prizes"
          :key="prize.id"
          class="wheel-prize-item"
        >
          <img v-if="prize.image" :src="prize.image" class="wheel-prize-item__img" alt="" />
          <span v-else class="wheel-prize-item__dot" :style="{ background: prize.color }" />
          <span>{{ prize.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wheel-page {
  padding-top: 8px;
}

.wheel-header {
  text-align: center;
  padding: 16px;
}

.wheel-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
}

.wheel-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.wheel-tickets {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 0 16px 8px;
  padding: 14px;
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
}

.wheel-tickets__label {
  font-size: 14px;
  font-weight: 600;
}

.wheel-tickets__count {
  font-size: 28px;
  font-weight: 900;
  color: var(--accent);
}

.wheel-spin-btn {
  margin: 16px;
}

.wheel-result {
  margin: 0 16px 16px;
  padding: 20px;
  background: var(--bg-card);
  border: 2px solid var(--accent);
  border-radius: var(--radius-lg);
  text-align: center;
  animation: fadeIn 0.4s ease;
}

.wheel-result__img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--accent);
  margin: 0 auto 12px;
}

.wheel-result__title {
  font-size: 14px;
  color: var(--accent);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.wheel-result__prize {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 8px;
}

.wheel-result__code {
  font-size: 16px;
  margin-bottom: 6px;
}

.wheel-result__code strong {
  color: var(--accent);
  font-family: monospace;
  font-size: 18px;
}

.wheel-result__desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.wheel-prizes-list {
  margin: 8px 16px 24px;
  padding: 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.wheel-prizes-list__title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-secondary);
}

.wheel-prize-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
  border-bottom: 1px solid var(--border-light);
}

.wheel-prize-item:last-child {
  border-bottom: none;
}

.wheel-prize-item__img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.wheel-prize-item__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
