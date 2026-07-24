import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { runSync, getSyncStatus } from '../services/sync.js';

const router = Router();
router.use(adminAuth);

// Статус последней синхронизации
router.get('/status', (_req, res) => {
  res.json(getSyncStatus());
});

// Запустить синхронизацию вручную
router.post('/run', async (_req, res) => {
  const result = await runSync();
  res.json(result);
});

export default router;
