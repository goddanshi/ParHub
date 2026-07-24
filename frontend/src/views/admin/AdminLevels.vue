<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';

const levels = ref([]);
const loading = ref(false);
const showModal = ref(false);
const editing = ref(null);

const emptyForm = () => ({ name: '', minAmount: 0, badge: '⭐', perk: '', color: '#ff9000', sortOrder: 0 });
const form = ref(emptyForm());

onMounted(load);

async function load() {
  loading.value = true;
  try { levels.value = await api.admin.levels.list(); }
  finally { loading.value = false; }
}

function openCreate() { editing.value = null; form.value = emptyForm(); showModal.value = true; }

function openEdit(level) {
  editing.value = level;
  form.value = { name: level.name, minAmount: level.minAmount, badge: level.badge, perk: level.perk || '', color: level.color, sortOrder: level.sortOrder };
  showModal.value = true;
}

async function save() {
  try {
    const payload = { ...form.value, minAmount: Number(form.value.minAmount) || 0 };
    if (editing.value) await api.admin.levels.update(editing.value.id, payload);
    else await api.admin.levels.create(payload);
    showModal.value = false;
    load();
  } catch (e) { alert(e.message); }
}

async function remove(level) {
  if (!confirm(`Удалить уровень «${level.name}»?`)) return;
  try { await api.admin.levels.delete(level.id); load(); }
  catch (e) { alert(e.message); }
}

function formatAmount(n) {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
}
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">Уровни лояльности</h1>
      <button class="admin-btn admin-btn--primary" @click="openCreate">+ Уровень</button>
    </div>

    <div v-if="loading" class="admin-card">
      <div class="admin-state"><div class="admin-spinner" /><span>Загрузка...</span></div>
    </div>

    <div v-else-if="!levels.length" class="admin-card">
      <div class="admin-state"><p class="admin-empty">Уровней пока нет. Создайте первый уровень.</p></div>
    </div>

    <div v-else class="levels-list">
      <div v-for="level in levels" :key="level.id" class="level-card admin-card">
        <div class="level-card__badge" :style="{ background: level.color + '22', borderColor: level.color }">
          <span class="level-card__emoji">{{ level.badge }}</span>
        </div>
        <div class="level-card__body">
          <div class="level-card__name" :style="{ color: level.color }">{{ level.name }}</div>
          <div class="level-card__amount">от {{ formatAmount(level.minAmount) }}</div>
          <div v-if="level.perk" class="level-card__perk">🎁 {{ level.perk }}</div>
        </div>
        <div class="level-card__actions">
          <button class="admin-btn admin-btn--ghost admin-btn--sm" @click="openEdit(level)">Изм.</button>
          <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(level)">Удалить</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="admin-modal-overlay" @click.self="showModal = false">
      <div class="admin-modal">
        <h2 class="admin-modal__title">{{ editing ? 'Редактировать уровень' : 'Новый уровень' }}</h2>

        <div class="admin-form-grid admin-form-grid--2">
          <div class="admin-form-group">
            <label>Бейдж (эмодзи) *</label>
            <input v-model="form.badge" class="admin-input level-badge-input" maxlength="8" placeholder="⭐" />
          </div>
          <div class="admin-form-group">
            <label>Цвет</label>
            <input v-model="form.color" type="color" class="wheel-color-input" />
          </div>
        </div>

        <div class="admin-form-group">
          <label>Название *</label>
          <input v-model="form.name" class="admin-input" placeholder="Золото" />
        </div>

        <div class="admin-form-group">
          <label>Мин. сумма покупок (₽) *</label>
          <input v-model.number="form.minAmount" type="number" min="0" class="admin-input" placeholder="10000" />
        </div>

        <div class="admin-form-group">
          <label>Плюшка (привилегия)</label>
          <input v-model="form.perk" class="admin-input" placeholder="Скидка 5% на все заказы" />
        </div>

        <!-- Предпросмотр -->
        <div class="level-preview" :style="{ borderColor: form.color, background: form.color + '11' }">
          <span class="level-preview__badge">{{ form.badge || '⭐' }}</span>
          <div>
            <div class="level-preview__name" :style="{ color: form.color }">{{ form.name || 'Название' }}</div>
            <div class="level-preview__info">от {{ formatAmount(form.minAmount) }}</div>
            <div v-if="form.perk" class="level-preview__perk">🎁 {{ form.perk }}</div>
          </div>
        </div>

        <div class="admin-modal__actions">
          <button class="admin-btn admin-btn--ghost" @click="showModal = false">Отмена</button>
          <button class="admin-btn admin-btn--primary" @click="save">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.levels-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
}

.level-card__badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.level-card__emoji {
  font-size: 26px;
  line-height: 1;
}

.level-card__body {
  flex: 1;
  min-width: 0;
}

.level-card__name {
  font-size: 16px;
  font-weight: 700;
}

.level-card__amount {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.level-card__perk {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.level-card__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.level-badge-input {
  font-size: 22px;
  text-align: center;
}

.level-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid;
  border-radius: 12px;
  margin-top: 4px;
}

.level-preview__badge {
  font-size: 32px;
  line-height: 1;
}

.level-preview__name {
  font-size: 16px;
  font-weight: 700;
}

.level-preview__info {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.level-preview__perk {
  font-size: 12px;
  color: #aaa;
  margin-top: 4px;
}

.wheel-color-input {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
