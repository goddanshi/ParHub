import { Router } from 'express';
import { getTabs } from '../db/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  const tabs = await getTabs();
  res.json(tabs.filter((t) => t.visible));
});

export default router;
