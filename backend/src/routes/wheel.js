import { Router } from 'express';
import { readDb, updateDb } from '../data/store.js';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { pickPrizeByProbability } from '../utils/wheel.js';

const router = Router();

function getUserId(req) {
  return String(req.telegramUser.id);
}

router.get('/config', async (_req, res) => {
  const db = await readDb();
  res.json({
    enabled: db.wheel.enabled,
    minPurchaseAmount: db.wheel.minPurchaseAmount,
    prizes: db.wheel.prizes.map(({ id, label, description, type, color, image, productId }) => ({
      id,
      label,
      description,
      type,
      color,
      image: image || null,
      productId: productId || null,
    })),
  });
});

router.get('/tickets', telegramAuth, async (req, res) => {
  const db = await readDb();
  const userId = getUserId(req);
  const tickets = (db.spinTickets[userId] || []).filter((t) => !t.used);
  res.json({ tickets, count: tickets.length });
});

router.post('/spin', telegramAuth, async (req, res) => {
  const db = await readDb();

  if (!db.wheel.enabled) {
    return res.status(400).json({ error: 'Колесо временно отключено' });
  }

  const userId = getUserId(req);
  const tickets = db.spinTickets[userId] || [];
  const available = tickets.find((t) => !t.used);

  if (!available) {
    return res.status(400).json({ error: 'Нет доступных билетов. Совершите покупку от 10 000 ₽' });
  }

  const prize = pickPrizeByProbability(db.wheel.prizes);
  if (!prize) {
    return res.status(500).json({ error: 'Призы не настроены' });
  }

  await updateDb((data) => {
    const userTickets = data.spinTickets[userId] || [];
    const ticket = userTickets.find((t) => t.id === available.id);
    if (ticket) ticket.used = true;
    return data;
  });

  res.json({
    prize: {
      id: prize.id,
      label: prize.label,
      description: prize.description,
      type: prize.type,
      couponCode: prize.couponCode,
      color: prize.color,
      image: prize.image || null,
      productId: prize.productId || null,
    },
    segmentIndex: db.wheel.prizes.findIndex((p) => p.id === prize.id),
  });
});

export default router;
