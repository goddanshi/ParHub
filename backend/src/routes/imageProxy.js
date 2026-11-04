import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { msRequest, MoySkladBlockedError } from '../services/moysklad.js';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';

// Кэш на диске (в docker — том uploads_data): каждая картинка скачивается из МойСклад один раз,
// иначе каждый просмотр каталога превращается в десятки запросов к API и упирается в лимиты.
const CACHE_DIR = process.env.IMAGE_CACHE_DIR || path.join(process.cwd(), 'uploads', 'ms-cache');
const MISS_TTL_MS = 10 * 60 * 1000;

const inflight = new Map(); // key -> Promise<{ type, data } | null>
const misses = new Map();   // key -> время, до которого не повторяем неудачный запрос

// Отдаём ответ, только если это настоящее изображение, а не JSON
async function tryFetchImage(url) {
  if (!url) return null;
  const res = await msRequest(url);
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return null;
  return res;
}

async function fetchFromMoySklad(href) {
  const upstream = await msRequest(href);
  if (!upstream.ok) return null;

  const ct = upstream.headers.get('content-type') || 'image/jpeg';
  if (!ct.includes('application/json')) {
    // Прямая ссылка на изображение
    return { type: ct, data: Buffer.from(await upstream.arrayBuffer()) };
  }

  // JSON-ответ: это meta.href ресурса изображения — ищем прямую ссылку
  const body = await upstream.json();
  const candidates = [
    body.meta?.downloadHref,
    body.miniature?.downloadHref,
    body.miniature?.href,
    body.tiny?.downloadHref,
  ];

  for (const url of candidates) {
    const img = await tryFetchImage(url);
    if (img) {
      return { type: img.headers.get('content-type') || 'image/jpeg', data: Buffer.from(await img.arrayBuffer()) };
    }
  }
  return null;
}

async function readCache(key) {
  try {
    const [data, meta] = await Promise.all([
      fs.readFile(path.join(CACHE_DIR, key)),
      fs.readFile(path.join(CACHE_DIR, `${key}.type`), 'utf8'),
    ]);
    return { type: meta, data };
  } catch {
    return null;
  }
}

async function writeCache(key, { type, data }) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(path.join(CACHE_DIR, key), data);
    await fs.writeFile(path.join(CACHE_DIR, `${key}.type`), type);
  } catch (err) {
    console.error('[proxy] Не удалось записать кэш:', err.message);
  }
}

router.get('/', async (req, res) => {
  const { href } = req.query;

  if (!href || !href.startsWith(MS_BASE)) {
    return res.status(400).end();
  }

  const key = crypto.createHash('sha1').update(href).digest('hex');

  try {
    let img = await readCache(key);

    if (!img) {
      if ((misses.get(key) ?? 0) > Date.now()) return res.status(404).end();

      // Одновременные запросы одной картинки объединяем в один
      let pending = inflight.get(key);
      if (!pending) {
        pending = fetchFromMoySklad(href).finally(() => inflight.delete(key));
        inflight.set(key, pending);
      }
      img = await pending;

      if (!img) {
        misses.set(key, Date.now() + MISS_TTL_MS);
        return res.status(404).end();
      }
      await writeCache(key, img);
    }

    res.set('Content-Type', img.type);
    res.set('Cache-Control', 'public, max-age=604800');
    return res.send(img.data);
  } catch (err) {
    if (err instanceof MoySkladBlockedError) return res.status(503).end();
    console.error('[proxy] Ошибка загрузки изображения:', err.message);
    res.status(502).end();
  }
});

export default router;
