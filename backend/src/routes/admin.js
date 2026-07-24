import { Router } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  getTabs, createTab, updateTab, deleteTab,
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, categoryHasProducts,
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getWheelConfig, updateWheelConfig, replaceWheelPrizes, createPrize, updatePrize, deletePrize,
  getAllOrders, updateOrderStatus, setOrderMsId, deleteOrder,
  createTicket, getTicketByOrderId,
  getAllUsers,
  getLoyaltyLevels, createLoyaltyLevel, updateLoyaltyLevel, deleteLoyaltyLevel,
  getStats,
} from '../db/index.js';
import { createCustomerOrder } from '../services/moysklad.js';
import { sendBotMessage } from '../utils/telegram.js';
import { ProxyAgent, fetch as undiciFetch } from 'undici';

function tgFetch(url, options = {}) {
  const proxyUrl = process.env.TELEGRAM_PROXY;
  if (proxyUrl) return undiciFetch(url, { ...options, dispatcher: new ProxyAgent(proxyUrl) });
  return fetch(url, options);
}

const router = Router();

// Debug (без авторизации — временно для диагностики)
router.get('/debug/channel/:userId', async (req, res) => {
  const token = process.env.BOT_TOKEN;
  const channel = process.env.REQUIRED_CHANNEL;
  if (!token || !channel) return res.json({ error: 'BOT_TOKEN или REQUIRED_CHANNEL не заданы', token: !!token, channel });

  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(channel)}&user_id=${req.params.userId}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const tgRes = await tgFetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await tgRes.json();
    res.json({ channel, userId: req.params.userId, telegramResponse: data });
  } catch (e) {
    res.json({ error: e.message, hint: 'Сервер не может достучаться до api.telegram.org', channel, userId: req.params.userId });
  }
});

router.use(adminAuth);

const MS_BASE = 'https://api.moysklad.ru';
function proxyUrl(url) {
  if (!url || !url.startsWith(MS_BASE)) return url;
  return `/api/ms-image?href=${encodeURIComponent(url)}`;
}
function transformProduct(p) {
  return {
    ...p,
    image: proxyUrl(p.image),
    images: Array.isArray(p.images) ? p.images.map(u => (typeof u === 'string' ? proxyUrl(u) : u)) : p.images,
  };
}

// --- Tabs ---

router.get('/tabs', async (_req, res) => {
  res.json(await getTabs());
});

router.post('/tabs', async (req, res) => {
  const tab = req.body;
  if (!tab.label || !tab.path) return res.status(400).json({ error: 'label и path обязательны' });
  const allTabs = await getTabs();
  const newTab = await createTab({
    id: tab.id || `tab_${crypto.randomUUID().slice(0, 8)}`,
    label: tab.label,
    icon: tab.icon || 'grid',
    path: tab.path,
    order: tab.order ?? allTabs.length,
    visible: tab.visible !== false,
  });
  res.status(201).json(newTab);
});

router.put('/tabs/:id', async (req, res) => {
  const tab = await updateTab(req.params.id, req.body);
  if (!tab) return res.status(404).json({ error: 'Tab not found' });
  res.json(tab);
});

router.delete('/tabs/:id', async (req, res) => {
  await deleteTab(req.params.id);
  res.json({ ok: true });
});

// --- Categories ---

router.get('/categories', async (_req, res) => {
  res.json(await getCategories());
});

router.post('/categories', async (req, res) => {
  const { name, icon, id, order } = req.body;
  if (!name) return res.status(400).json({ error: 'name обязателен' });
  const allCats = await getCategories();
  const cat = await createCategory({
    id: id || name.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
    name,
    icon: icon || '📦',
    order: order ?? allCats.length,
  });
  res.status(201).json(cat);
});

router.put('/categories/:id', async (req, res) => {
  const existing = await getCategoryById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });
  res.json(await updateCategory(req.params.id, req.body));
});

router.delete('/categories/:id', async (req, res) => {
  if (await categoryHasProducts(req.params.id)) {
    return res.status(400).json({ error: 'В категории есть товары. Сначала удалите или переместите их.' });
  }
  await deleteCategory(req.params.id);
  res.json({ ok: true });
});

// --- Products ---

router.get('/products', async (_req, res) => {
  res.json((await getProducts()).map(transformProduct));
});

router.get('/products/:id', async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(transformProduct(product));
});

router.post('/products', async (req, res) => {
  const { name, price, categoryId } = req.body;
  if (!name || price == null || !categoryId) {
    return res.status(400).json({ error: 'name, price, categoryId обязательны' });
  }
  res.status(201).json(await createProduct(req.body));
});

router.put('/products/:id', async (req, res) => {
  const product = await updateProduct(req.params.id, req.body);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.delete('/products/:id', async (req, res) => {
  await deleteProduct(req.params.id);
  res.json({ ok: true });
});

// --- Wheel ---

router.get('/wheel', async (_req, res) => {
  const config = await getWheelConfig();
  if (config?.prizes) {
    config.prizes = config.prizes.map(p => ({ ...p, image: proxyUrl(p.image) }));
  }
  res.json(config);
});

router.put('/wheel', async (req, res) => {
  await updateWheelConfig({
    enabled: req.body.enabled,
    minPurchaseAmount: req.body.minPurchaseAmount,
  });
  if (Array.isArray(req.body.prizes)) {
    await replaceWheelPrizes(req.body.prizes);
  }
  res.json(await getWheelConfig());
});

router.post('/wheel/prizes', async (req, res) => {
  const prize = req.body;
  if (!prize.label) return res.status(400).json({ error: 'label обязателен' });
  const newPrize = await createPrize({
    id: prize.id || `p_${crypto.randomUUID().slice(0, 8)}`,
    ...prize,
  });
  res.status(201).json(newPrize);
});

router.put('/wheel/prizes/:id', async (req, res) => {
  const prize = await updatePrize(req.params.id, req.body);
  if (!prize) return res.status(404).json({ error: 'Prize not found' });
  res.json(prize);
});

router.delete('/wheel/prizes/:id', async (req, res) => {
  await deletePrize(req.params.id);
  res.json({ ok: true });
});

// --- Stats ---

router.get('/stats', async (_req, res) => {
  res.json(await getStats());
});

// --- Orders ---

router.get('/orders', async (_req, res) => {
  const orders = await getAllOrders();
  res.json(orders.map(o => ({
    ...o,
    items: o.items.map(item => ({ ...item, image: proxyUrl(item.image) })),
  })));
});

router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Неверный статус' });
  await updateOrderStatus(req.params.id, status);

  if (status === 'confirmed') {
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === req.params.id);
    const wheelConfig = await getWheelConfig();
    if (order && wheelConfig?.enabled && order.total >= wheelConfig.minPurchaseAmount) {
      const existing = await getTicketByOrderId(order.id);
      if (!existing) {
        const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await createTicket({ id: crypto.randomUUID(), userId: order.userId, orderId: order.id, createdAt });
      }
    }
  }

  res.json({ ok: true });
});

router.delete('/orders/:id', async (req, res) => {
  await deleteOrder(req.params.id);
  res.json({ ok: true });
});

router.post('/orders/:id/send-to-ms', async (req, res) => {
  if (!process.env.MOYSKLAD_TOKEN) return res.status(400).json({ error: 'MOYSKLAD_TOKEN не задан' });
  const orders = await getAllOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Заказ не найден' });
  try {
    const msId = await createCustomerOrder(order, { id: order.userId, username: order.userUsername, first_name: order.userName });
    await setOrderMsId(order.id, msId);
    res.json({ ok: true, msOrderId: msId });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// --- Users ---

router.get('/users', async (_req, res) => {
  res.json(await getAllUsers());
});

router.post('/users/:id/grant-ticket', async (req, res) => {
  const userId = req.params.id;
  const count = Math.max(1, Math.min(100, Number(req.body.count) || 1));
  for (let i = 0; i < count; i++) {
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await createTicket({ id: crypto.randomUUID(), userId, orderId: null, createdAt });
  }
  res.json({ ok: true, granted: count });
});

// --- Loyalty levels ---

router.get('/levels', async (_req, res) => {
  res.json(await getLoyaltyLevels());
});

router.post('/levels', async (req, res) => {
  const { name, minAmount, badge, perk, color, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'name обязателен' });
  res.status(201).json(await createLoyaltyLevel({ name, minAmount, badge, perk, color, sortOrder }));
});

router.put('/levels/:id', async (req, res) => {
  const level = await updateLoyaltyLevel(Number(req.params.id), req.body);
  if (!level) return res.status(404).json({ error: 'Уровень не найден' });
  res.json(level);
});

router.delete('/levels/:id', async (req, res) => {
  await deleteLoyaltyLevel(Number(req.params.id));
  res.json({ ok: true });
});

// --- Broadcast ---

router.get('/broadcast/users-count', async (_req, res) => {
  const users = await getAllUsers();
  res.json({ count: users.length });
});

router.post('/broadcast', async (req, res) => {
  const { text, imageUrl, buttonLabel, buttonUrl } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Текст сообщения обязателен' });

  const users = await getAllUsers();
  if (!users.length) return res.json({ total: 0, sent: 0, failed: 0 });

  const replyMarkup = buttonLabel && buttonUrl
    ? { inline_keyboard: [[{ text: buttonLabel, url: buttonUrl }]] }
    : undefined;

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await sendBotMessage(user.id, text.trim(), { imageUrl: imageUrl || undefined, replyMarkup });
      sent++;
    } catch {
      failed++;
    }
    // Telegram: max ~30 msg/s — safe delay
    await new Promise(r => setTimeout(r, 50));
  }

  res.json({ total: users.length, sent, failed });
});

export default router;
