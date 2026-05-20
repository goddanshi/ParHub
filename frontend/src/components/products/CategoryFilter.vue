<script setup>
const props = defineProps({
  categories: { type: Array, default: () => [] },
  activeCategory: { type: String, default: 'all' },
});

const emit = defineEmits(['select']);

const allCategories = [{ id: 'all', name: 'Все', icon: '🔥' }, ...props.categories];
</script>

<template>
  <div class="category-filter">
    <button
      v-for="cat in allCategories"
      :key="cat.id"
      class="category-filter__chip"
      :class="{ 'category-filter__chip--active': activeCategory === cat.id }"
      @click="emit('select', cat.id)"
    >
      <span class="category-filter__icon">{{ cat.icon }}</span>
      <span class="category-filter__name">{{ cat.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-filter__chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.2s;
  flex-shrink: 0;
}

.category-filter__chip--active {
  background: var(--accent-muted);
  border-color: var(--accent);
  color: var(--accent);
}

.category-filter__icon {
  font-size: 14px;
}
</style>
