<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';

const categories = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ name: '', icon: '📦', order: 0 });

async function load() {
  categories.value = await api.admin.categories.list();
}

function openCreate() {
  editing.value = null;
  form.value = { name: '', icon: '📦', order: categories.value.length };
  showModal.value = true;
}

function openEdit(cat) {
  editing.value = cat;
  form.value = { ...cat };
  showModal.value = true;
}

async function save() {
  if (editing.value) {
    await api.admin.categories.update(editing.value.id, form.value);
  } else {
    await api.admin.categories.create(form.value);
  }
  showModal.value = false;
  await load();
}

async function remove(id) {
  if (!confirm('Удалить категорию?')) return;
  try {
    await api.admin.categories.delete(id);
    await load();
  } catch (e) {
    alert(e.message);
  }
}

onMounted(load);
</script>

<template>
  <div>
    <h1 class="admin-page-title">Категории</h1>
    <div class="admin-actions">
      <button class="admin-btn admin-btn--primary" @click="openCreate">+ Категория</button>
    </div>

    <div class="admin-card">
      <table class="admin-table">
        <thead>
          <tr><th>Иконка</th><th>Название</th><th>ID</th><th>Порядок</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td style="font-size: 24px">{{ cat.icon }}</td>
            <td>{{ cat.name }}</td>
            <td><code>{{ cat.id }}</code></td>
            <td>{{ cat.order }}</td>
            <td>
              <button class="admin-btn admin-btn--ghost admin-btn--sm" @click="openEdit(cat)">Изменить</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" @click="remove(cat.id)">Удалить</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="admin-modal-overlay" @click.self="showModal = false">
      <div class="admin-modal">
        <h2 class="admin-modal__title">{{ editing ? 'Редактировать' : 'Новая категория' }}</h2>
        <div class="admin-form-group">
          <label>Название</label>
          <input v-model="form.name" class="admin-input" />
        </div>
        <div class="admin-form-group">
          <label>Иконка (emoji)</label>
          <input v-model="form.icon" class="admin-input" />
        </div>
        <div class="admin-form-group">
          <label>Порядок</label>
          <input v-model.number="form.order" type="number" class="admin-input" />
        </div>
        <div class="admin-modal__actions">
          <button class="admin-btn admin-btn--ghost" @click="showModal = false">Отмена</button>
          <button class="admin-btn admin-btn--primary" @click="save">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>
