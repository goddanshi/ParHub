<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const admin = useAdminStore();
const router = useRouter();
const token = ref('');

onMounted(() => {
  document.documentElement.classList.add('is-admin');
  if (admin.authenticated) {
    router.replace('/admin');
  }
});

async function login() {
  try {
    await admin.login(token.value);
    router.push('/admin');
  } catch {
    // error in store
  }
}
</script>

<template>
  <div class="admin-login">
    <div class="admin-login__card">
      <div class="admin-login__brand">
        <span class="admin-login__logo">V</span>
        <div>
          <h1>Vape Admin</h1>
          <p>Панель управления магазином</p>
        </div>
      </div>

      <form @submit.prevent="login">
        <div class="admin-form-group">
          <label>Токен администратора</label>
          <input
            v-model="token"
            type="password"
            class="admin-input"
            placeholder="Введите ADMIN_TOKEN"
            required
            autocomplete="current-password"
          />
        </div>
        <p v-if="admin.error" class="admin-login__error">{{ admin.error }}</p>
        <button type="submit" class="admin-btn admin-btn--primary admin-btn--block" :disabled="admin.loading">
          {{ admin.loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>

      <a href="/" class="admin-login__back">← Вернуться в магазин</a>
    </div>
  </div>
</template>

<style scoped>
.admin-login {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(ellipse at top, rgba(255, 144, 0, 0.08) 0%, transparent 50%), #0a0a0a;
}

.admin-login__card {
  width: 100%;
  max-width: 420px;
  padding: 36px 32px;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
}

.admin-login__brand {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 32px;
}

.admin-login__logo {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff9000, #ff7700);
  color: #000;
  font-size: 24px;
  font-weight: 900;
  border-radius: 12px;
}

.admin-login__brand h1 {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
}

.admin-login__brand p {
  font-size: 13px;
  color: #888;
}

.admin-login__error {
  color: #ff6b6b;
  font-size: 13px;
  margin-bottom: 12px;
}

.admin-login__back {
  display: block;
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #666;
  text-decoration: none;
}

.admin-login__back:hover {
  color: #ff9000;
}
</style>
