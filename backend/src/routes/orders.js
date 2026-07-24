import { Router } from 'express';
import crypto from 'crypto';
import { getProductById, createOrder, getOrdersByUser, setOrderMsId } from '../db/index.js';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { createCustomerOrder } from '../services/moysklad.js';

const router = Router();

const MS_BASE = 'https://api.moysklad.ru';
function proxyUrl(url) {
  if (!url || !url.startsWith(MS_BASE)) return url;
  return `/api/ms-image?href=${encodeURIComponent(url)}`;
}

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
    orderItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty, image: product.image, externalId: product.externalId || null });
  }

  const order = { id: crypto.randomUUID(), userId, items: orderItems, total, createdAt: new Date().toISOString() };
  await createOrder(order);

  // Отправка в МойСклад — не блокируем ответ
  if (process.env.MOYSKLAD_TOKEN) {
    createCustomerOrder(order, req.telegramUser)
      .then(msId => setOrderMsId(order.id, msId))
      .catch(err => console.error('[ms-order]', err.message));
  }

  res.json({
    order,
    spinTicketGranted: false,
    availableTickets: 0,
    message: 'Заказ оформлен! Ожидайте подтверждения.',
  });
});

router.get('/', telegramAuth, async (req, res) => {
  const orders = await getOrdersByUser(String(req.telegramUser.id));
  res.json(orders.map(o => ({
    ...o,
    items: o.items.map(item => ({ ...item, image: proxyUrl(item.image) })),
  })));
});

export default router;
