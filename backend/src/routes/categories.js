import { Router } from 'express';
import { getCategories } from '../db/index.js';

const router = Router();

router.get('/', async (_req, res) => {
  res.json(await getCategories());
});

export default router;
