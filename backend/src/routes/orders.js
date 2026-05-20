import { Router } from 'express';
import { readDb, updateDb } from '../data/store.js';
import { telegramAuth } from '../middleware/telegramAuth.js';
import crypto from 'crypto';

const router = Router();

function getUserId(req) {
  return String(req.telegramUser.id);
}

router.post('/checkout', telegramAuth, async (req, res) => {
  const { items } = req.body;
  if (!items?.length) {
    return res.status(400).json({ error: 'Корзина пуста' });
  }

  const db = await readDb();
  const userId = getUserId(req);

  let total = 0;
  const orderItems = [];

  for (const { productId, quantity } of items) {
    const product = db.products.find((p) => p.id === Number(productId));
    if (!product || !product.inStock) {
      return res.status(400).json({ error: `Товар #${productId} недоступен` });
    }
    const qty = Math.max(1, Number(quantity) || 1);
    total += product.price * qty;
    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.image,
    });
  }

  const order = {
    id: crypto.randomUUID(),
    userId,
    items: orderItems,
    total,
    createdAt: new Date().toISOString(),
  };

  let spinTicketGranted = false;

  await updateDb((data) => {
    data.orders.push(order);

    if (data.wheel.enabled && total >= data.wheel.minPurchaseAmount) {
      if (!data.spinTickets[userId]) data.spinTickets[userId] = [];
      data.spinTickets[userId].push({
        id: crypto.randomUUID(),
        orderId: order.id,
        used: false,
        createdAt: new Date().toISOString(),
      });
      spinTicketGranted = true;
    }

    return data;
  });

  const updatedDb = await readDb();
  const tickets = (updatedDb.spinTickets[userId] || []).filter((t) => !t.used);

  res.json({
    order,
    spinTicketGranted,
    availableTickets: tickets.length,
    message: spinTicketGranted
      ? `Заказ оформлен! Вам начислен билет на колесо фортуны 🎉`
      : 'Заказ оформлен!',
  });
});

router.get('/', telegramAuth, async (req, res) => {
  const db = await readDb();
  const userId = getUserId(req);
  const orders = db.orders.filter((o) => o.userId === userId).reverse();
  res.json(orders);
});

export default router;
