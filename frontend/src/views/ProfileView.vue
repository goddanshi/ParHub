<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

const router = useRouter();

const authStore = useAuthStore();
const profile = ref(null);
const loading = ref(true);
const showLevels = ref(false);

const displayName = computed(() => {
  const u = profile.value || authStore.user;
  if (!u) return 'Гость';
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || 'Пользователь';
});

const initials = computed(() => {
  const name = displayName.value;
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
});

onMounted(async () => {
  try {
    profile.value = await api.users.me();
  } catch {
    // fallback to auth store user
  } finally {
    loading.value = false;
  }
});

const menuItems = computed(() => [
  { icon: 'wheel', label: 'Рулетка', action: () => router.push('/wheel'), badge: profile.value?.availableSpinTickets },
  { icon: 'orders', label: 'Мои заказы', action: () => router.push('/orders'), count: profile.value?.orders?.length || 0 },
]);
</script>

<template>
  <div class="page">
    <div class="page-content">
      <div class="profile-header">
        <div v-if="loading" class="profile-avatar skeleton" />
        <div v-else-if="profile?.photoUrl" class="profile-avatar">
          <img :src="profile.photoUrl" alt="" />
        </div>
        <div v-else class="profile-avatar profile-avatar--initials">
          {{ initials }}
        </div>

        <div class="profile-info">
          <h1 v-if="loading" class="skeleton" style="height: 24px; width: 160px; border-radius: 6px" />
          <h1 v-else class="profile-name">{{ displayName }}</h1>

          <p v-if="profile?.username" class="profile-username">@{{ profile.username }}</p>
          <p v-else-if="authStore.user?.username" class="profile-username">
            @{{ authStore.user.username }}
          </p>
        </div>
      </div>

      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat__value">{{ profile?.orders?.length || 0 }}</span>
          <span class="profile-stat__label">Заказов</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__value">{{ profile?.availableSpinTickets || 0 }}</span>
          <span class="profile-stat__label">Билетов</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__value">{{ (profile?.totalSpent || 0).toLocaleString('ru-RU') }} ₽</span>
          <span class="profile-stat__label">Потрачено</span>
        </div>
      </div>

      <!-- Уровень лояльности -->
      <button
        v-if="profile?.loyalty?.currentLevel"
        class="loyalty-card"
        :style="{ borderColor: profile.loyalty.currentLevel.color, background: profile.loyalty.currentLevel.color + '11' }"
        @click="showLevels = true"
      >
        <span class="loyalty-card__badge">{{ profile.loyalty.currentLevel.badge }}</span>
        <div class="loyalty-card__info">
          <span class="loyalty-card__name" :style="{ color: profile.loyalty.currentLevel.color }">
            {{ profile.loyalty.currentLevel.name }}
          </span>
          <span v-if="profile.loyalty.currentLevel.perk" class="loyalty-card__perk">
            🎁 {{ profile.loyalty.currentLevel.perk }}
          </span>
          <span v-if="profile.loyalty.nextLevel" class="loyalty-card__next">
            До «{{ profile.loyalty.nextLevel.name }}»: {{ (profile.loyalty.nextLevel.minAmount - profile.totalSpent).toLocaleString('ru-RU') }} ₽
          </span>
        </div>
        <svg class="loyalty-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      <div class="profile-menu">
        <button v-for="item in menuItems" :key="item.label" class="profile-menu__item" @click="item.action?.()">
          <div class="profile-menu__icon">
            <svg v-if="item.icon === 'orders'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <svg v-else-if="item.icon === 'heart'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <span class="profile-menu__label">{{ item.label }}</span>
          <span v-if="item.badge" class="profile-menu__count profile-menu__count--accent">{{ item.badge }}</span>
          <span v-else-if="item.count !== undefined" class="profile-menu__count">{{ item.count }}</span>
          <svg class="profile-menu__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div v-if="authStore.error" class="profile-error">
        Ошибка авторизации: {{ authStore.error }}
      </div>
    </div>

    <!-- Модалка уровней -->
    <transition name="fade">
      <div v-if="showLevels" class="levels-overlay" @click.self="showLevels = false">
        <div class="levels-modal">
          <div class="levels-modal__head">
            <h2 class="levels-modal__title">🏆 Программа лояльности</h2>
            <button class="levels-modal__close" @click="showLevels = false">✕</button>
          </div>

          <div class="levels-modal__spent">
            Ваши покупки: <strong>{{ (profile?.totalSpent || 0).toLocaleString('ru-RU') }} ₽</strong>
          </div>

          <!-- Прогресс-бар до следующего уровня -->
          <div v-if="profile?.loyalty?.nextLevel" class="levels-progress">
            <div class="levels-progress__bar">
              <div
                class="levels-progress__fill"
                :style="{
                  width: Math.min(100, (profile.totalSpent / profile.loyalty.nextLevel.minAmount) * 100) + '%',
                  background: profile.loyalty.nextLevel.color,
                }"
              />
            </div>
            <div class="levels-progress__label">
              {{ (profile.totalSpent || 0).toLocaleString('ru-RU') }} / {{ profile.loyalty.nextLevel.minAmount.toLocaleString('ru-RU') }} ₽
            </div>
          </div>

          <div class="levels-list">
            <div
              v-for="level in profile?.loyalty?.levels"
              :key="level.id"
              class="levels-item"
              :class="{ 'levels-item--active': level.id === profile?.loyalty?.currentLevel?.id }"
              :style="level.id === profile?.loyalty?.currentLevel?.id ? { borderColor: level.color, background: level.color + '11' } : {}"
            >
              <span class="levels-item__badge">{{ level.badge }}</span>
              <div class="levels-item__body">
                <span class="levels-item__name" :style="{ color: level.color }">{{ level.name }}</span>
                <span class="levels-item__amount">от {{ level.minAmount.toLocaleString('ru-RU') }} ₽</span>
                <span v-if="level.perk" class="levels-item__perk">🎁 {{ level.perk }}</span>
              </div>
              <span v-if="level.id === profile?.loyalty?.currentLevel?.id" class="levels-item__current">Ваш уровень</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--accent);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar--initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-muted);
  color: var(--accent);
  font-size: 24px;
  font-weight: 800;
}

.profile-name {
  font-size: 22px;
  font-weight: 800;
}

.profile-username {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.profile-stats {
  display: flex;
  margin: 0 16px 20px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  overflow: hidden;
}

.profile-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 8px;
  border-right: 1px solid var(--border);
}

.profile-stat:last-child {
  border-right: none;
}

.profile-stat__value {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
}

.profile-stat__label {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.profile-menu {
  margin: 0 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  overflow: hidden;
}

.profile-menu__item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  text-align: left;
  transition: background 0.15s;
}

.profile-menu__item:last-child {
  border-bottom: none;
}

.profile-menu__item:active {
  background: var(--bg-elevated);
}

.profile-menu__icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-muted);
  border-radius: var(--radius-sm);
  color: var(--accent);
}

.profile-menu__label {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
}

.profile-menu__count {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

.profile-menu__count--accent {
  color: var(--accent);
  background: var(--accent-muted);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.profile-menu__arrow {
  color: var(--text-muted);
}

.loyalty-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 16px 16px;
  padding: 14px 16px;
  border: 1px solid;
  border-radius: var(--radius-md);
  text-align: left;
  width: calc(100% - 32px);
  transition: opacity 0.15s;
}

.loyalty-card:active { opacity: 0.75; }

.loyalty-card__badge { font-size: 32px; line-height: 1; flex-shrink: 0; }

.loyalty-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.loyalty-card__name { font-size: 16px; font-weight: 800; }
.loyalty-card__perk { font-size: 12px; color: var(--text-secondary); }
.loyalty-card__next { font-size: 11px; color: var(--text-muted); }
.loyalty-card__arrow { color: var(--text-muted); flex-shrink: 0; }

/* Модалка */
.levels-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.levels-modal {
  width: 100%;
  max-height: 85vh;
  background: var(--bg-secondary);
  border-radius: 20px 20px 0 0;
  overflow-y: auto;
  padding: 20px 16px 32px;
}

.levels-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.levels-modal__title { font-size: 18px; font-weight: 800; margin: 0; }

.levels-modal__close {
  width: 32px;
  height: 32px;
  background: var(--bg-elevated);
  border-radius: 50%;
  font-size: 14px;
  color: var(--text-muted);
}

.levels-modal__spent {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.levels-modal__spent strong { color: var(--accent); }

.levels-progress {
  margin-bottom: 20px;
}

.levels-progress__bar {
  height: 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.levels-progress__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.levels-progress__label {
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
}

.levels-list { display: flex; flex-direction: column; gap: 8px; }

.levels-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.levels-item--active { border-width: 2px; }

.levels-item__badge { font-size: 26px; line-height: 1; flex-shrink: 0; }

.levels-item__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.levels-item__name { font-size: 15px; font-weight: 700; }
.levels-item__amount { font-size: 12px; color: var(--text-muted); }
.levels-item__perk { font-size: 12px; color: var(--text-secondary); }

.levels-item__current {
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-muted);
  padding: 3px 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.profile-error {
  margin: 16px;
  padding: 12px 16px;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--danger);
  font-size: 13px;
}
</style>
