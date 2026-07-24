import { Router } from 'express';
import { getOrdersByUser, getAvailableTickets, getLoyaltyLevels, resolveLoyaltyLevel } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';

const router = Router();

router.get('/me', telegramAuth, async (req, res) => {
  const user = req.telegramUser;
  const userId = String(user.id);

  const [orders, tickets, levels] = await Promise.all([
    getOrdersByUser(userId),
    getAvailableTickets(userId),
    getLoyaltyLevels(),
  ]);

  const totalSpent = orders
    .filter(o => o.status === 'confirmed' || o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const currentLevel = resolveLoyaltyLevel(levels, totalSpent);
  const sorted = [...levels].sort((a, b) => a.minAmount - b.minAmount);
  const nextLevel = currentLevel
    ? sorted.find(l => l.minAmount > currentLevel.minAmount) || null
    : sorted[0] || null;

  res.json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
    photoUrl: user.photo_url || null,
    orders,
    availableSpinTickets: tickets.length,
    totalSpent,
    loyalty: {
      levels,
      currentLevel,
      nextLevel,
    },
  });
});

export default router;
