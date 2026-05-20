import { Router } from 'express';
import { readDb } from '../data/store.js';

const router = Router();

router.get('/', async (req, res) => {
  const { category, search, sort, inStock } = req.query;
  const db = await readDb();
  let result = [...db.products];

  if (category && category !== 'all') {
    result = result.filter((p) => p.categoryId === category);
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.fullDescription || '').toLowerCase().includes(q)
    );
  }

  if (inStock === 'true') {
    result = result.filter((p) => p.inStock);
  }

  switch (sort) {
    case 'price_asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }

  res.json(result);
});

router.get('/:id', async (req, res) => {
  const db = await readDb();
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

export default router;
