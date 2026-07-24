<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api/client';

const users = ref([]);
const loading = ref(false);
const search = ref('');
const grantingId = ref(null);
const ticketCounts = ref({});

onMounted(load);

async function load() {
  loading.value = true;
  try { users.value = await api.admin.users.list(); }
  finally { loading.value = false; }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return users.value;
  return users.value.filter(u =>
    u.firstName?.toLowerCase().includes(q) ||
    u.lastName?.toLowerCase().includes(q) ||
    u.username?.toLowerCase().includes(q) ||
    String(u.id).includes(q)
  );
});

async function grantTicket(user) {
  const count = Math.max(1, Number(ticketCounts.value[user.id]) || 1);
  grantingId.value = user.id;
  try {
    await api.admin.users.grantTicket(user.id, count);
    ticketCounts.value[user.id] = 1;
    alert(`✅ Выдано ${count} билет(ов) пользователю ${userName(user)}`);
  } catch (e) {
    alert('Ошибка: ' + e.message);
  } finally {
    grantingId.value = null;
  }
}

function userName(u) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
  return name || u.username || `ID ${u.id}`;
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">Пользователи</h1>
      <button class="admin-btn admin-btn--ghost" @click="load">Обновить</button>
    </div>

    <div class="admin-card" style="margin-bottom: 12px; padding: 12px 16px;">
      <input
        v-model="search"
        class="admin-input"
        placeholder="Поиск по имени, @username или ID..."
      />
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state"><div class="admin-spinner" /><span>Загрузка...</span></div>
    </div>

    <div v-else-if="!filtered.length" class="admin-card">
      <div class="admin-state"><p class="admin-empty">Пользователей не найдено</p></div>
    </div>

    <div v-else class="users-list">
      <div v-for="user in filtered" :key="user.id" class="user-card admin-card">
        <div class="user-card__head">
          <div class="user-card__avatar">
            <img v-if="user.photoUrl" :src="user.photoUrl" alt="" />
            <span v-else>{{ (user.firstName?.[0] || '?').toUpperCase() }}</span>
          </div>
          <div class="user-card__info">
            <span class="user-card__name">{{ userName(user) }}</span>
            <span v-if="user.username" class="user-card__username">@{{ user.username }}</span>
            <span class="user-card__id">ID: {{ user.id }}</span>
          </div>
          <div class="user-card__meta">
            <span class="user-card__last">{{ formatDate(user.lastSeen) }}</span>
          </div>
        </div>

        <div class="user-card__grant">
          <div class="grant-row">
            <span class="grant-label">Выдать билеты на рулетку:</span>
            <div class="grant-controls">
              <button
                class="grant-btn"
                @click="ticketCounts[user.id] = Math.max(1, (ticketCounts[user.id] || 1) - 1)"
              >−</button>
              <input
                type="number"
                min="1"
                max="100"
                :value="ticketCounts[user.id] || 1"
                class="grant-input"
                @change="ticketCounts[user.id] = Math.max(1, parseInt($event.target.value) || 1)"
                @focus="$event.target.select()"
              />
              <button
                class="grant-btn"
                @click="ticketCounts[user.id] = Math.min(100, (ticketCounts[user.id] || 1) + 1)"
              >+</button>
              <button
                class="admin-btn admin-btn--primary admin-btn--sm"
                :disabled="grantingId === user.id"
                @click="grantTicket(user)"
              >
                {{ grantingId === user.id ? '...' : '🎫 Выдать' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-card__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  color: var(--accent);
  flex-shrink: 0;
  overflow: hidden;
}

.user-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.user-card__name {
  font-size: 14px;
  font-weight: 700;
}

.user-card__username {
  font-size: 12px;
  color: #888;
}

.user-card__id {
  font-size: 11px;
  color: #555;
  font-family: monospace;
}

.user-card__meta {
  flex-shrink: 0;
}

.user-card__last {
  font-size: 11px;
  color: #555;
}

.user-card__grant {
  border-top: 1px solid #222;
  padding-top: 10px;
}

.grant-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.grant-label {
  font-size: 13px;
  color: #aaa;
}

.grant-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.grant-btn {
  width: 30px;
  height: 30px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.grant-input {
  width: 48px;
  height: 30px;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  -moz-appearance: textfield;
}

.grant-input::-webkit-inner-spin-button,
.grant-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
}
</style>
