import { Router } from 'express';
import { getProducts, getProductById } from '../db/index.js';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';

function proxyUrl(url) {
  if (!url || !url.startsWith(MS_BASE)) return url;
  return `/api/ms-image?href=${encodeURIComponent(url)}`;
}

function transform(p) {
  return {
    ...p,
    image: proxyUrl(p.image),
    images: Array.isArray(p.images)
      ? p.images.map(u => (typeof u === 'string' ? proxyUrl(u) : u))
      : p.images,
  };
}

router.get('/', async (req, res) => {
  const { category, search, sort, inStock } = req.query;
  const products = await getProducts({ category, search, sort, inStock });
  res.json(products.map(transform));
});

router.get('/:id', async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(transform(product));
});

export default router;
