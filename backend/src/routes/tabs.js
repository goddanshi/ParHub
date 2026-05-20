import { Router } from 'express';
import { readDb } from '../data/store.js';

const router = Router();

router.get('/', async (_req, res) => {
  const db = await readDb();
  const tabs = db.tabs
    .filter((t) => t.visible)
    .sort((a, b) => a.order - b.order);
  res.json(tabs);
});

export default router;
