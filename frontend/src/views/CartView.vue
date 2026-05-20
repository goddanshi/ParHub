<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useWheelStore } from '@/stores/wheel';
import { useTelegram } from '@/composables/useTelegram';

const cart = useCartStore();
const wheelStore = useWheelStore();
const router = useRouter();
const { haptic } = useTelegram();
const checkoutMessage = ref(null);

onMounted(() => wheelStore.fetchConfig());

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

async function checkout() {
  if (!cart.items.length) return;
  haptic('medium');
  try {
    const result = await cart.checkout();
    checkoutMessage.value = result.message;
    await wheelStore.fetchTickets();
    haptic('heavy');
    setTimeout(() => router.push(result.spinTicketGranted ? '/wheel' : '/profile'), 1500);
  } catch (e) {
    alert(e.message);
  }
}
</script>

<template>
  <div class="page">
    <div class="page-content">
      <h2 class="section-title">Корзина</h2>

      <div v-if="!cart.items.length" class="cart-empty">
        <p>Корзина пуста</p>
        <router-link to="/catalog" class="btn btn--primary">В каталог</router-link>
      </div>

      <div v-else class="cart-items">
        <div v-for="item in cart.items" :key="item.productId" class="cart-item">
          <img :src="item.image" :alt="item.name" class="cart-item__img" />
          <div class="cart-item__info">
            <h3>{{ item.name }}</h3>
            <p class="cart-item__price">{{ formatPrice(item.price) }}</p>
            <div class="cart-item__qty">
              <button @click="cart.setQuantity(item.productId, item.quantity - 1)">−</button>
              <span>{{ item.quantity }}</span>
              <button @click="cart.setQuantity(item.productId, item.quantity + 1)">+</button>
            </div>
          </div>
          <button class="cart-item__remove" @click="cart.remove(item.productId)">✕</button>
        </div>
      </div>

      <div v-if="checkoutMessage" class="cart-message">{{ checkoutMessage }}</div>
    </div>

    <div v-if="cart.items.length" class="cart-footer">
      <div class="cart-footer__total">
        <span>Итого</span>
        <span class="cart-footer__price">{{ formatPrice(cart.total) }}</span>
      </div>
      <p v-if="cart.total >= (wheelStore.config?.minPurchaseAmount || 10000)" class="cart-footer__hint">
        🎉 Вы получите билет на колесо!
      </p>
      <button class="btn btn--primary btn--block" :disabled="cart.loading" @click="checkout">
        {{ cart.loading ? 'Оформление...' : 'Оформить заказ' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px;
  color: var(--text-muted);
}

.cart-items {
  padding: 0 16px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
}

.cart-item__img {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: var(--bg-elevated);
}

.cart-item__info {
  flex: 1;
}

.cart-item__info h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.cart-item__price {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 8px;
}

.cart-item__qty {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cart-item__qty button {
  width: 28px;
  height: 28px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  font-size: 16px;
  font-weight: 700;
}

.cart-item__remove {
  color: var(--text-muted);
  font-size: 18px;
  padding: 4px;
}

.cart-footer {
  position: fixed;
  bottom: calc(var(--nav-height) + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  padding: 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
}

.cart-footer__total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 16px;
}

.cart-footer__price {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
}

.cart-footer__hint {
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 10px;
}

.cart-message {
  margin: 16px;
  padding: 14px;
  background: var(--accent-muted);
  border: 1px solid var(--accent);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 600;
}
</style>
