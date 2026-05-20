<script setup>
defineProps({
  size: { type: String, default: 'md' }, // sm | md | lg
});
</script>

<template>
  <span class="shop-logo" :class="`shop-logo--${size}`">
    <span class="shop-logo__par">Par</span><span class="shop-logo__hub">Hub</span>
  </span>
</template>

<style scoped>
.shop-logo {
  display: inline-flex;
  align-items: center;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.shop-logo--sm {
  font-size: 16px;
}

.shop-logo--md {
  font-size: 20px;
}

.shop-logo--lg {
  font-size: 28px;
}

.shop-logo__par {
  color: var(--text-primary, #fff);
}

.shop-logo__hub {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 7px;
  margin-left: 2px;
  background: var(--accent, #ff9000);
  color: #000;
  font-weight: 900;
  border-radius: 6px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}

.shop-logo--lg .shop-logo__hub {
  padding: 4px 10px;
  border-radius: 8px;
}
</style>
