import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api/client';

export const useCartStore = defineStore('cart', () => {
  const items = ref([]);
  const loading = ref(false);
  const lastOrder = ref(null);

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  const count = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  );

  function add(product, quantity = 1) {
    const existing = items.value.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }
  }

  function remove(productId) {
    items.value = items.value.filter((i) => i.productId !== productId);
  }

  function setQuantity(productId, quantity) {
    const item = items.value.find((i) => i.productId === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  }

  function clear() {
    items.value = [];
  }

  async function checkout() {
    loading.value = true;
    try {
      const result = await api.orders.checkout(
        items.value.map((i) => ({ productId: i.productId, quantity: i.quantity }))
      );
      lastOrder.value = result;
      clear();
      return result;
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, lastOrder, total, count, add, remove, setQuantity, clear, checkout };
});
