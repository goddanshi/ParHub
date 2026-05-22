import { Router } from 'express';
import crypto from 'crypto';
import { getProductById, createOrder, getOrdersByUser, getAvailableTickets, createTicket, getWheelConfig } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';

const router = Router();

router.post('/checkout', telegramAuth, async (req, res) => {
  const { items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'Корзина пуста' });

  const userId = String(req.telegramUser.id);
  let total = 0;
  const orderItems = [];

  for (const { productId, quantity } of items) {
    const product = await getProductById(productId);
    if (!product || !product.inStock) {
      return res.status(400).json({ error: `Товар #${productId} недоступен` });
    }
    const qty = Math.max(1, Number(quantity) || 1);
    total += product.price * qty;
    orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty, image: product.image });
  }

  const order = { id: crypto.randomUUID(), userId, items: orderItems, total, createdAt: new Date().toISOString() };
  await createOrder(order);

  let spinTicketGranted = false;
  const wheelConfig = await getWheelConfig();
  if (wheelConfig?.enabled && total >= wheelConfig.minPurchaseAmount) {
    await createTicket({ id: crypto.randomUUID(), userId, orderId: order.id, createdAt: new Date().toISOString() });
    spinTicketGranted = true;
  }

  const availableTickets = await getAvailableTickets(userId);

  res.json({
    order,
    spinTicketGranted,
    availableTickets: availableTickets.length,
    message: spinTicketGranted
      ? 'Заказ оформлен! Вам начислен билет на колесо фортуны 🎉'
      : 'Заказ оформлен!',
  });
});

router.get('/', telegramAuth, async (req, res) => {
  res.json(await getOrdersByUser(String(req.telegramUser.id)));
});

export default router;
