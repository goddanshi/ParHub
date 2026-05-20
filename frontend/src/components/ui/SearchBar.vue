<script setup>
const model = defineModel({ type: String, default: '' });

const emit = defineEmits(['search']);

function onInput() {
  emit('search', model.value);
}
</script>

<template>
  <div class="search-bar">
    <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
    <input
      v-model="model"
      type="search"
      class="search-bar__input"
      placeholder="Поиск товаров..."
      @input="onInput"
    />
    <button v-if="model" class="search-bar__clear" @click="model = ''; emit('search', '')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 16px;
  padding: 0 14px;
  height: 44px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
}

.search-bar__icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-bar__input {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}

.search-bar__input::placeholder {
  color: var(--text-muted);
}

.search-bar__clear {
  color: var(--text-muted);
  display: flex;
  padding: 4px;
}
</style>
