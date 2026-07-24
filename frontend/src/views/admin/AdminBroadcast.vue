<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/api/client';

const usersCount = ref(0);
const sending = ref(false);
const result = ref(null);
const confirmStep = ref(false);

const form = ref({
  text: '',
  imageUrl: '',
  buttonLabel: '',
  buttonUrl: '',
});

onMounted(async () => {
  try {
    const data = await api.admin.broadcast.usersCount();
    usersCount.value = data.count;
  } catch { /* ignore */ }
});

function requestSend() {
  if (!form.value.text.trim()) return;
  confirmStep.value = true;
}

function cancelSend() {
  confirmStep.value = false;
}

async function doSend() {
  confirmStep.value = false;
  sending.value = true;
  result.value = null;
  try {
    result.value = await api.admin.broadcast.send({
      text: form.value.text,
      imageUrl: form.value.imageUrl || undefined,
      buttonLabel: form.value.buttonLabel || undefined,
      buttonUrl: form.value.buttonUrl || undefined,
    });
  } catch (e) {
    result.value = { error: e.message };
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <div>
    <div class="admin-page-header">
      <h1 class="admin-page-title">Рассылка</h1>
    </div>

    <div class="admin-card broadcast-card">
      <p class="broadcast-hint">
        Получатели: <strong>{{ usersCount }}</strong> пользователей
        <span class="broadcast-hint__sub">(все, кто заходил в магазин)</span>
      </p>

      <div class="admin-form-group">
        <label>Текст сообщения <span class="req">*</span></label>
        <textarea
          v-model="form.text"
          class="admin-input broadcast-textarea"
          placeholder="Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;a href=&quot;...&quot;&gt;ссылка&lt;/a&gt;"
          rows="5"
        />
      </div>

      <div class="admin-form-group">
        <label>URL картинки <span class="optional">(опционально)</span></label>
        <input
          v-model="form.imageUrl"
          class="admin-input"
          placeholder="https://..."
        />
        <img
          v-if="form.imageUrl"
          :src="form.imageUrl"
          class="broadcast-img-preview"
          alt=""
          @error="($event.target).style.display = 'none'"
        />
      </div>

      <div class="broadcast-section-title">Кнопка под сообщением <span class="optional">(опционально)</span></div>
      <div class="admin-form-grid admin-form-grid--2">
        <div class="admin-form-group">
          <label>Текст кнопки</label>
          <input v-model="form.buttonLabel" class="admin-input" placeholder="Открыть магазин" />
        </div>
        <div class="admin-form-group">
          <label>URL кнопки</label>
          <input v-model="form.buttonUrl" class="admin-input" placeholder="https://..." />
        </div>
      </div>

      <!-- Превью -->
      <div v-if="form.text" class="broadcast-preview">
        <div class="broadcast-preview__label">Предпросмотр</div>
        <div class="broadcast-preview__bubble">
          <img v-if="form.imageUrl" :src="form.imageUrl" class="broadcast-preview__img" alt="" />
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p class="broadcast-preview__text" v-html="form.text.replace(/\n/g, '<br>')" />
          <button v-if="form.buttonLabel" class="broadcast-preview__btn">
            {{ form.buttonLabel }}
          </button>
        </div>
      </div>

      <div v-if="confirmStep" class="broadcast-confirm">
        <p>Отправить сообщение <strong>{{ usersCount }}</strong> пользователям?</p>
        <div class="broadcast-confirm__actions">
          <button class="admin-btn admin-btn--ghost" @click="cancelSend">Отмена</button>
          <button class="admin-btn admin-btn--primary" @click="doSend">Да, отправить</button>
        </div>
      </div>

      <button
        v-else
        class="admin-btn admin-btn--primary broadcast-send-btn"
        :disabled="!form.text.trim() || sending"
        @click="requestSend"
      >
        {{ sending ? 'Отправляем...' : `Отправить всем (${usersCount})` }}
      </button>

      <!-- Результат -->
      <div v-if="result" class="broadcast-result" :class="result.error ? 'broadcast-result--error' : 'broadcast-result--ok'">
        <template v-if="result.error">
          ❌ Ошибка: {{ result.error }}
        </template>
        <template v-else>
          ✅ Готово — отправлено: <strong>{{ result.sent }}</strong>,
          ошибок: <strong>{{ result.failed }}</strong>
          (всего {{ result.total }})
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.broadcast-card {
  max-width: 680px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.broadcast-hint {
  font-size: 14px;
  color: #aaa;
  margin: 0;
}

.broadcast-hint strong {
  color: var(--accent);
  font-size: 16px;
}

.broadcast-hint__sub {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
}

.req {
  color: #ff6b6b;
}

.optional {
  color: #666;
  font-size: 12px;
  font-weight: 400;
}

.broadcast-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.broadcast-img-preview {
  margin-top: 8px;
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #333;
  display: block;
}

.broadcast-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: -12px;
}

.broadcast-preview {
  background: #0d0d0d;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 16px;
}

.broadcast-preview__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #555;
  margin-bottom: 12px;
}

.broadcast-preview__bubble {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 12px 14px;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.broadcast-preview__img {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
}

.broadcast-preview__text {
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

.broadcast-preview__btn {
  align-self: stretch;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #4a9eff;
  font-size: 13px;
  padding: 8px;
  cursor: default;
  text-align: center;
}

.broadcast-send-btn {
  align-self: flex-start;
}

.broadcast-confirm {
  background: #1a1a1a;
  border: 1px solid var(--accent);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.broadcast-confirm p {
  margin: 0;
  font-size: 14px;
}

.broadcast-confirm__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.broadcast-result {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
}

.broadcast-result--ok {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid #4caf50;
  color: #4caf50;
}

.broadcast-result--error {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #ff6b6b;
  color: #ff6b6b;
}
</style>
