import { Router } from 'express';
import { getOrdersByUser, getAvailableTickets } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';

const router = Router();

router.get('/me', telegramAuth, async (req, res) => {
  const user = req.telegramUser;
  const userId = String(user.id);

  const [orders, tickets] = await Promise.all([
    getOrdersByUser(userId),
    getAvailableTickets(userId),
  ]);

  res.json({
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
    photoUrl: user.photo_url || null,
    orders,
    availableSpinTickets: tickets.length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
  });
});

export default router;
