import { Router } from 'express';
import { getWheelConfig, getAvailableTickets, useTicket } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { pickPrizeByProbability } from '../utils/wheel.js';

const router = Router();

router.get('/config', async (_req, res) => {
  const config = await getWheelConfig();
  if (!config) return res.status(500).json({ error: 'Колесо не настроено' });
  res.json({
    enabled: config.enabled,
    minPurchaseAmount: config.minPurchaseAmount,
    prizes: config.prizes.map(({ id, label, description, type, color, image, productId }) => ({
      id, label, description, type, color, image, productId,
    })),
  });
});

router.get('/tickets', telegramAuth, async (req, res) => {
  const tickets = await getAvailableTickets(String(req.telegramUser.id));
  res.json({ tickets, count: tickets.length });
});

router.post('/spin', telegramAuth, async (req, res) => {
  const config = await getWheelConfig();
  if (!config?.enabled) return res.status(400).json({ error: 'Колесо временно отключено' });

  const userId = String(req.telegramUser.id);
  const tickets = await getAvailableTickets(userId);
  const available = tickets[0];
  if (!available) {
    return res.status(400).json({ error: 'Нет доступных билетов. Совершите покупку от 10 000 ₽' });
  }

  const prize = pickPrizeByProbability(config.prizes);
  if (!prize) return res.status(500).json({ error: 'Призы не настроены' });

  await useTicket(available.id);

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
    segmentIndex: config.prizes.findIndex((p) => p.id === prize.id),
  });
});

export default router;
