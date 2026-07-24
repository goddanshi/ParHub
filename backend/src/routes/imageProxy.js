import { Router } from 'express';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';

async function fetchWithAuth(url) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${process.env.MOYSKLAD_TOKEN}` },
  });
}

// Fetch URL and return response only if it's an actual image (not JSON)
async function tryFetchImage(url) {
  if (!url) return null;
  const res = await fetchWithAuth(url);
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return null;
  return res;
}

router.get('/', async (req, res) => {
  const { href } = req.query;

  if (!href || !href.startsWith(MS_BASE)) {
    return res.status(400).end();
  }

  try {
    const upstream = await fetchWithAuth(href);
    if (!upstream.ok) return res.status(upstream.status).end();

    const ct = upstream.headers.get('content-type') || 'image/jpeg';

    if (!ct.includes('application/json')) {
      // Прямая ссылка на изображение — отдаём сразу
      res.set('Content-Type', ct);
      res.set('Cache-Control', 'public, max-age=604800');
      return res.send(Buffer.from(await upstream.arrayBuffer()));
    }

    // JSON-ответ: это meta.href ресурса изображения — парсим и ищем прямую ссылку
    const body = await upstream.json();

    // body.meta.downloadHref — оригинал; body.miniature.downloadHref — превью
    const candidates = [
      body.meta?.downloadHref,
      body.miniature?.downloadHref,
      body.miniature?.href,
      body.tiny?.downloadHref,
    ];

    for (const url of candidates) {
      const img = await tryFetchImage(url);
      if (img) {
        res.set('Content-Type', img.headers.get('content-type') || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=604800');
        return res.send(Buffer.from(await img.arrayBuffer()));
      }
    }

    res.status(404).end();
  } catch (err) {
    console.error('[proxy] Ошибка загрузки изображения:', err.message);
    res.status(502).end();
  }
});

export default router;
