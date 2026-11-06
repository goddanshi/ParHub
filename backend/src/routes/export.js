import { Router } from 'express';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { getProducts, getCategories } from '../db/index.js';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';

// Внешнему сервису нельзя ходить в МойСклад — отдаём картинки
// через наш кэширующий прокси /api/ms-image
function absoluteUrl(url) {
  if (!url) return null;
  const appUrl = (process.env.APP_URL || '').replace(/\/$/, '');
  if (url.startsWith(MS_BASE)) {
    return `${appUrl}/api/ms-image?href=${encodeURIComponent(url)}`;
  }
  if (url.startsWith('/')) return `${appUrl}${url}`;
  return url;
}

function exportProduct(p) {
  return {
    externalId: p.externalId,
    name: p.name,
    description: p.description,
    price: p.price,
    oldPrice: p.oldPrice,
    categoryId: p.categoryId,
    image: absoluteUrl(p.image),
    images: Array.isArray(p.images) ? p.images.map(absoluteUrl).filter(Boolean) : [],
    inStock: p.inStock,
  };
}

router.use(apiKeyAuth);

router.get('/categories', async (_req, res) => {
  const categories = await getCategories();
  res.json({ total: categories.length, items: categories });
});

router.get('/products', async (req, res) => {
  const { category, search, inStock } = req.query;
  const products = await getProducts({ category, search, inStock });
  res.json({ total: products.length, items: products.map(exportProduct) });
});

export default router;
