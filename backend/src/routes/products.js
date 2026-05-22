import { Router } from 'express';
import { getProducts, getProductById } from '../db/index.js';

const router = Router();

router.get('/', async (req, res) => {
  const { category, search, sort, inStock } = req.query;
  res.json(await getProducts({ category, search, sort, inStock }));
});

router.get('/:id', async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

export default router;
