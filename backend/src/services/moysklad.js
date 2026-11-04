const BASE = 'https://api.moysklad.ru/api/remap/1.2';

function token() {
  const t = process.env.MOYSKLAD_TOKEN;
  if (!t) throw new Error('MOYSKLAD_TOKEN не задан в .env');
  return t;
}

// --- Транспорт: очередь, лимиты, предохранитель ---
//
// Лимиты МойСклад: для токена пользователя вес запроса растёт (с 01.12.2026 — 11 запросов
// за 3 с), report/stock/* стоит 5 единиц. Если отдавать много ошибок (особенно 429) или
// получать 401/403, МойСклад отключает пользователю доступ к API (ошибка 1061) — вернуть
// его можно только через поддержку. Поэтому все запросы идут через один интервальный
// планировщик, а при серии ошибок предохранитель блокирует запросы на время.

const MIN_GAP_MS      = Number(process.env.MOYSKLAD_MIN_INTERVAL_MS) || 400; // ~7 запросов за 3 с
const HEAVY_GAP_MS    = 2000;                                                // отчёты остатков (5 единиц)
const MAX_429_RETRIES = 3;
const BREAKER_ERRORS  = 5;               // ошибок подряд до паузы
const BREAKER_PAUSE_MS = 10 * 60 * 1000;
const AUTH_PAUSE_MS    = 60 * 60 * 1000; // 401 / 1061: ждём, пока починят токен или доступ

export class MoySkladBlockedError extends Error {}

let nextSlot = 0;
let consecutiveErrors = 0;
let blockedUntil = 0;
let blockedReason = '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function reserveSlot(gapMs) {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + gapMs;
  return sleep(at - now);
}

function block(ms, reason) {
  blockedUntil = Date.now() + ms;
  blockedReason = reason;
  console.error(`[moysklad] Запросы приостановлены на ${Math.round(ms / 60000)} мин: ${reason}`);
}

export function getMoySkladState() {
  const blocked = Date.now() < blockedUntil;
  return {
    blocked,
    reason: blocked ? blockedReason : null,
    blockedUntil: blocked ? new Date(blockedUntil).toISOString() : null,
    consecutiveErrors,
  };
}

function assertNotBlocked() {
  if (Date.now() < blockedUntil) {
    throw new MoySkladBlockedError(`МойСклад: запросы приостановлены (${blockedReason})`);
  }
}

// Все обращения к api.moysklad.ru идут только через эту функцию
export async function msRequest(url, { method = 'GET', headers = {}, body, gap = MIN_GAP_MS } = {}) {
  for (let attempt = 0; ; attempt++) {
    assertNotBlocked();
    await reserveSlot(gap);
    assertNotBlocked();

    const res = await fetch(url, {
      method,
      body,
      headers: { Authorization: `Bearer ${token()}`, 'Accept-Encoding': 'gzip', ...headers },
    });

    if (res.ok || res.status === 404) {
      consecutiveErrors = 0;
      return res;
    }

    if (res.status === 401) {
      block(AUTH_PAUSE_MS, '401: токен неверный, просрочен или отозван');
      throw new MoySkladBlockedError(`МойСклад 401: ${blockedReason}`);
    }
    if (res.status === 403) {
      const code = (await res.clone().json().catch(() => null))?.errors?.[0]?.code;
      if (code === 1061) {
        block(AUTH_PAUSE_MS, '1061: доступ к API отключён для пользователя (обратитесь в поддержку МойСклад)');
        throw new MoySkladBlockedError(`МойСклад 403: ${blockedReason}`);
      }
    }

    consecutiveErrors++;
    if (consecutiveErrors >= BREAKER_ERRORS) {
      block(BREAKER_PAUSE_MS, `${consecutiveErrors} ошибок подряд, последняя ${res.status}`);
      return res;
    }

    if (res.status === 429 && attempt < MAX_429_RETRIES) {
      const wait = Number(res.headers.get('x-lognex-retry-after')) || 3000;
      await sleep(Math.min(wait, 30_000) + 200);
      continue;
    }
    return res;
  }
}

async function msGet(path, opts) {
  const res = await msRequest(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`МойСклад ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function getAllPages(path) {
  const sep = path.includes('?') ? '&' : '?';
  const limit = 100;
  let offset = 0;
  const rows = [];

  while (true) {
    const data = await msGet(`${path}${sep}limit=${limit}&offset=${offset}`);
    rows.push(...data.rows);
    if (rows.length >= data.meta.size) break;
    offset += limit;
  }

  return rows;
}

// Все группы товаров (категории)
export async function fetchFolders() {
  return getAllPages('/entity/productfolder');
}

// Все товары (без expand — images всегда только meta, rows не приходят)
export async function fetchProducts() {
  return getAllPages('/entity/product');
}

// Остатки: возвращает Map<productHref, quantity> (все страницы)
export async function fetchStockMap() {
  const limit = 1000;
  let offset = 0;
  const map = new Map();

  while (true) {
    const data = await msGet(`/report/stock/all?groupBy=product&limit=${limit}&offset=${offset}`, { gap: HEAVY_GAP_MS });
    for (const row of data.rows) {
      const href = row.assortment?.meta?.href?.split('?')[0];
      if (href) map.set(href, Number(row.stock ?? 0));
    }
    if (data.rows.length < limit) break;
    offset += limit;
  }

  return map;
}

// Получить один ресурс по полному href (для вебхуков)
export async function fetchByHref(fullHref) {
  const res = await msRequest(fullHref.split('?')[0]);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`МойСклад ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Остаток конкретного товара по href
export async function fetchProductStock(productHref) {
  try {
    const encoded = encodeURIComponent(productHref);
    const data = await msGet(`/report/stock/all?filter=product=${encoded}`, { gap: HEAVY_GAP_MS });
    return Number(data.rows?.[0]?.stock ?? 0) > 0;
  } catch (err) {
    if (err instanceof MoySkladBlockedError) throw err;
    return null; // не удалось — оставить как есть
  }
}

// Получить список изображений товара по его href.
// Пустой массив — только если у товара нет изображений (404); остальные ошибки пробрасываем,
// чтобы синхронизация не продолжала сыпать запросами в ответ на 429/403.
export async function fetchProductImages(productHref) {
  const res = await msRequest(`${productHref}/images`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`МойСклад ${res.status} ${productHref}/images`);
  const data = await res.json();
  return data.rows ?? [];
}

// Создать заказ покупателя в МойСклад
let _orgHref   = null;
let _agentHref = null;

async function getOrgHref() {
  if (_orgHref) return _orgHref;
  const data = await msGet('/entity/organization?limit=1');
  if (!data.rows?.length) throw new Error('Нет организаций в МойСклад');
  _orgHref = data.rows[0].meta.href;
  return _orgHref;
}

async function getAgentHref() {
  if (_agentHref) return _agentHref;
  const id = process.env.MOYSKLAD_AGENT_ID;
  if (id) { _agentHref = `${BASE}/entity/counterparty/${id}`; return _agentHref; }
  const data = await msGet('/entity/counterparty?limit=1');
  if (!data.rows?.length) return null;
  _agentHref = data.rows[0].meta.href;
  return _agentHref;
}

export async function createCustomerOrder(order, telegramUser) {
  const [orgHref, agentHref] = await Promise.all([getOrgHref(), getAgentHref()]);

  const positions = order.items
    .filter(item => item.externalId)
    .map(item => ({
      quantity: item.quantity,
      price: Math.round(item.price * 100),
      assortment: {
        meta: { href: `${BASE}/entity/product/${item.externalId}`, type: 'product', mediaType: 'application/json' },
      },
    }));

  const name = `@${telegramUser?.username || telegramUser?.id || 'tg'}`;
  const body = {
    name:         `TG-${order.id.slice(0, 8)}`,
    description:  `Telegram: ${name} | ${telegramUser?.first_name || ''}`.trim(),
    organization: { meta: { href: orgHref, type: 'organization', mediaType: 'application/json' } },
    ...(positions.length && { positions }),
  };
  if (agentHref) body.agent = { meta: { href: agentHref, type: 'counterparty', mediaType: 'application/json' } };

  const res = await msRequest(`${BASE}/entity/customerorder`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`МойСклад заказ ${res.status}: ${errBody.slice(0, 300)}`);
  }
  const result = await res.json();
  return result.id;
}

// Скачать изображение как Buffer
export async function downloadImage(href) {
  const res = await msRequest(href);
  if (!res.ok) throw new Error(`Не удалось скачать изображение: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
