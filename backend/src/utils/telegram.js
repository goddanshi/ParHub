import crypto from 'crypto';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

const TG_API = 'https://api.telegram.org';

function tgFetch(url, options = {}) {
  const proxyUrl = process.env.TELEGRAM_PROXY;
  if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl);
    return undiciFetch(url, { ...options, dispatcher });
  }
  return fetch(url, options);
}

export async function checkChannelMember(userId) {
  const token = process.env.BOT_TOKEN;
  const channel = process.env.REQUIRED_CHANNEL;

  if (!token || !channel) {
    console.warn('[channel-check] REQUIRED_CHANNEL или BOT_TOKEN не заданы — пропускаем');
    return true;
  }

  const url = `${TG_API}/bot${token}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${userId}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await tgFetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
  const data = await res.json();

  console.log(`[channel-check] userId=${userId} channel=${channel} ok=${data.ok} status=${data?.result?.status} err=${data?.description || ''}`);

  if (!data.ok) {
    // Ошибка Telegram (бот не в канале, канал не найден и т.д.) — блокируем
    console.error('[channel-check] Telegram API error:', data.description);
    return false;
  }

  const status = data?.result?.status;
  return ['creator', 'administrator', 'member', 'restricted'].includes(status);
}

export async function sendBotMessage(chatId, text, { imageUrl, replyMarkup } = {}) {
  const token = process.env.BOT_TOKEN;
  if (!token) throw new Error('BOT_TOKEN не задан');

  const body = {
    chat_id: chatId,
    parse_mode: 'HTML',
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  };

  let method;
  if (imageUrl) {
    method = 'sendPhoto';
    body.photo = imageUrl;
    body.caption = text;
  } else {
    method = 'sendMessage';
    body.text = text;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await tgFetch(`${TG_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.description || `Telegram error ${res.status}`);
  }
  return res.json();
}


export function validateInitData(initData, botToken) {
  if (!initData) return null;
  if (!botToken) { console.warn('[auth] BOT_TOKEN не задан'); return null; }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const dcs = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed  = crypto.createHmac('sha256', secretKey).update(dcs).digest('hex');

  if (computed !== hash) {
    console.warn('[auth] hash не совпадает');
    return null;
  }

  return _parseUser(params);
}

function _parseUser(params) {
  const authDate = Number(params.get('auth_date'));
  if (authDate && Date.now() / 1000 - authDate > 86400) {
    console.warn('[auth] auth_date устарел (> 24ч)');
    return null;
  }
  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}
