const BASE = 'https://api.moysklad.ru/api/remap/1.2';

function token() {
  const t = process.env.MOYSKLAD_TOKEN;
  if (!t) throw new Error('MOYSKLAD_TOKEN не задан в .env');
  return t;
}

async function msGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token()}`,
      'Accept-Encoding': 'gzip',
    },
  });
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
    const data = await msGet(`/report/stock/all?groupBy=product&limit=${limit}&offset=${offset}`);
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
  const url = fullHref.split('?')[0];
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      'Accept-Encoding': 'gzip',
    },
  });
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
    const data = await msGet(`/report/stock/all?filter=product=${encoded}`);
    return Number(data.rows?.[0]?.stock ?? 0) > 0;
  } catch {
    return null; // не удалось — оставить как есть
  }
}

// Получить список изображений товара по его href
export async function fetchProductImages(productHref) {
  try {
    const res = await fetch(`${productHref}/images`, {
      headers: {
        Authorization: `Bearer ${token()}`,
        'Accept-Encoding': 'gzip',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rows ?? [];
  } catch {
    return [];
  }
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

  const res = await fetch(`${BASE}/entity/customerorder`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
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
  const res = await fetch(href, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!res.ok) throw new Error(`Не удалось скачать изображение: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
