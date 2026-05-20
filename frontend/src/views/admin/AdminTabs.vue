<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';

const tabs = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ label: '', icon: 'grid', path: '', order: 0, visible: true });

const icons = ['home', 'grid', 'wheel', 'user', 'cart'];

async function load() {
  tabs.value = await api.admin.tabs.list();
}

function openCreate() {
  editing.value = null;
  form.value = { label: '', icon: 'grid', path: '', order: tabs.value.length, visible: true };
  showModal.value = true;
}

function openEdit(tab) {
  editing.value = tab;
  form.value = { ...tab };
  showModal.value = true;
}

async function save() {
  if (editing.value) {
    await api.admin.tabs.update(editing.value.id, form.value);
  } else {
    await api.admin.tabs.create(form.value);
  }
  showModal.value = false;
  await load();
}

async function remove(id) {
  if (!confirm('Удалить вкладку?')) return;
  await api.admin.tabs.delete(id);
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="admin-page-title">Управление вкладками</h1>
    <div class="admin-actions">
      <button class="admin-btn admin-btn--primary" @click="openCreate">+ Добавить вкладку</button>
    </div>

    <div class="admin-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Порядок</th>
            <th>Название</th>
            <th>Иконка</th>
            <th>Путь</th>
            <th>Видимость</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tab in tabs" :key="tab.id">
            <td>{{ tab.order }}</td>
            <td>{{ tab.label }}</td>
            <td>{{ tab.icon }}</td>
            <td>{{ tab.path }}</td>
            <td>{{ tab.visible ? '✓' : '✕' }}</td>
            <td>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" @click="openEdit(tab)">Изменить</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(tab.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="admin-modal-overlay" @click.self="showModal = false">
      <div class="admin-modal">
        <h2 class="admin-modal__title">{{ editing ? 'Редактировать' : 'Новая вкладка' }}</h2>
        <div class="admin-form-group">
          <label>Название</label>
          <input v-model="form.label" class="admin-input" />
        </div>
        <div class="admin-form-group">
          <label>Путь (URL)</label>
          <input v-model="form.path" class="admin-input" placeholder="/catalog" />
        </div>
        <div class="admin-form-group">
          <label>Иконка</label>
          <select v-model="form.icon" class="admin-select">
            <option v-for="ic in icons" :key="ic" :value="ic">{{ ic }}</option>
          </select>
        </div>
        <div class="admin-form-group">
          <label>Порядок</label>
          <input v-model.number="form.order" type="number" class="admin-input" />
        </div>
        <label style="display: flex; align-items: center; gap: 8px">
          <input v-model="form.visible" type="checkbox" />
          Видимая
        </label>
        <div class="admin-modal__actions">
          <button class="admin-btn admin-btn--ghost" @click="showModal = false">Отмена</button>
          <button class="admin-btn admin-btn--primary" @click="save">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>
