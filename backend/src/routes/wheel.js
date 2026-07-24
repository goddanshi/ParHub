import { Router } from 'express';
import { getWheelConfig, getAvailableTickets, useTicket, createSpinResult, getSpinResults } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { pickPrizeByProbability } from '../utils/wheel.js';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';
function proxyUrl(url) {
  if (!url || !url.startsWith(MS_BASE)) return url;
  return `/api/ms-image?href=${encodeURIComponent(url)}`;
}

router.get('/config', async (_req, res) => {
  const config = await getWheelConfig();
  if (!config) return res.status(500).json({ error: 'Рулетка не настроена' });
  res.json({
    enabled: config.enabled,
    minPurchaseAmount: config.minPurchaseAmount,
    prizes: config.prizes.map(({ id, label, description, type, color, image, productId }) => ({
      id, label, description, type, color, image: proxyUrl(image), productId,
    })),
  });
});

router.get('/tickets', telegramAuth, async (req, res) => {
  const tickets = await getAvailableTickets(String(req.telegramUser.id));
  res.json({ tickets, count: tickets.length });
});

router.post('/spin', telegramAuth, async (req, res) => {
  const config = await getWheelConfig();
  if (!config?.enabled) return res.status(400).json({ error: 'Рулетка временно отключена' });

  const userId = String(req.telegramUser.id);
  const tickets = await getAvailableTickets(userId);
  const available = tickets[0];
  if (!available) {
    return res.status(400).json({ error: 'Нет доступных билетов. Совершите покупку от 10 000 ₽' });
  }

  const prize = pickPrizeByProbability(config.prizes);
  if (!prize) return res.status(500).json({ error: 'Призы не настроены' });

  await useTicket(available.id);

  const prizeData = {
    id: prize.id,
    label: prize.label,
    description: prize.description,
    type: prize.type,
    couponCode: prize.couponCode,
    color: prize.color,
    image: proxyUrl(prize.image) || null,
    productId: prize.productId || null,
  };

  createSpinResult(userId, prizeData).catch(() => {});

  res.json({
    prize: prizeData,
    segmentIndex: config.prizes.findIndex((p) => p.id === prize.id),
  });
});

router.get('/prizes', telegramAuth, async (req, res) => {
  const results = await getSpinResults(String(req.telegramUser.id));
  res.json(results);
});

export default router;
