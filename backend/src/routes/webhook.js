import { Router } from 'express';
import { webhookUpsertProduct, webhookDeleteProduct, webhookUpsertFolder } from '../services/sync.js';

const router = Router();

router.post('/', (req, res) => {
  // Проверяем секрет
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && req.query.token !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Отвечаем МойСклад сразу — они ждут 200 не более 5 секунд
  res.json({ ok: true });

  // Обрабатываем события асинхронно
  const events = req.body?.events || [];
  for (const event of events) {
    const href   = event.meta?.href;
    const type   = event.meta?.type;
    const action = event.action;

    if (!href || !type) continue;

    if (type === 'product') {
      if (action === 'DELETE') {
        webhookDeleteProduct(href);
      } else {
        webhookUpsertProduct(href);
      }
    } else if (type === 'productfolder') {
      if (action !== 'DELETE') {
        webhookUpsertFolder(href);
      }
    }
  }
});

export default router;
