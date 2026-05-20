import { Router } from 'express';
import { readDb } from '../data/store.js';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await readDb();
  const categories = [...db.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  res.json(categories);
});

export default router;
