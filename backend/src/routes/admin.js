import { Router } from 'express';
import crypto from 'crypto';
import { readDb, updateDb } from '../data/store.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();
router.use(adminAuth);

// --- Tabs ---
router.get('/tabs', async (_req, res) => {
  const db = await readDb();
  res.json([...db.tabs].sort((a, b) => a.order - b.order));
});

router.post('/tabs', async (req, res) => {
  const tab = req.body;
  if (!tab.label || !tab.path) {
    return res.status(400).json({ error: 'label и path обязательны' });
  }
  const created = await updateDb((data) => {
    const newTab = {
      id: tab.id || `tab_${crypto.randomUUID().slice(0, 8)}`,
      label: tab.label,
      icon: tab.icon || 'grid',
      path: tab.path,
      order: tab.order ?? data.tabs.length,
      visible: tab.visible !== false,
    };
    data.tabs.push(newTab);
    return data;
  });
  res.status(201).json(created.tabs[created.tabs.length - 1]);
});

router.put('/tabs/:id', async (req, res) => {
  const updated = await updateDb((data) => {
    const idx = data.tabs.findIndex((t) => t.id === req.params.id);
    if (idx === -1) throw new Error('NOT_FOUND');
    data.tabs[idx] = { ...data.tabs[idx], ...req.body, id: req.params.id };
    return data;
  });
  const tab = updated.tabs.find((t) => t.id === req.params.id);
  res.json(tab);
});

router.delete('/tabs/:id', async (req, res) => {
  await updateDb((data) => {
    data.tabs = data.tabs.filter((t) => t.id !== req.params.id);
    return data;
  });
  res.json({ ok: true });
});

// --- Categories ---
router.get('/categories', async (_req, res) => {
  const db = await readDb();
  res.json([...db.categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
});

router.post('/categories', async (req, res) => {
  const { name, icon, id, order } = req.body;
  if (!name) return res.status(400).json({ error: 'name обязателен' });

  const created = await updateDb((data) => {
    const cat = {
      id: id || name.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
      name,
      icon: icon || '📦',
      order: order ?? data.categories.length,
    };
    data.categories.push(cat);
    return data;
  });
  res.status(201).json(created.categories[created.categories.length - 1]);
});

router.put('/categories/:id', async (req, res) => {
  const updated = await updateDb((data) => {
    const idx = data.categories.findIndex((c) => c.id === req.params.id);
    if (idx === -1) throw new Error('NOT_FOUND');
    data.categories[idx] = { ...data.categories[idx], ...req.body, id: req.params.id };
    return data;
  });
  res.json(updated.categories.find((c) => c.id === req.params.id));
});

router.delete('/categories/:id', async (req, res) => {
  const hasProducts = (await readDb()).products.some((p) => p.categoryId === req.params.id);
  if (hasProducts) {
    return res.status(400).json({ error: 'В категории есть товары. Сначала удалите или переместите их.' });
  }
  await updateDb((data) => {
    data.categories = data.categories.filter((c) => c.id !== req.params.id);
    return data;
  });
  res.json({ ok: true });
});

// --- Products ---
router.get('/products', async (_req, res) => {
  const db = await readDb();
  res.json(db.products);
});

router.get('/products/:id', async (req, res) => {
  const db = await readDb();
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

router.post('/products', async (req, res) => {
  const body = req.body;
  if (!body.name || body.price == null || !body.categoryId) {
    return res.status(400).json({ error: 'name, price, categoryId обязательны' });
  }

  const created = await updateDb((data) => {
    const id = data.nextProductId++;
    const product = {
      id,
      name: body.name,
      description: body.description || '',
      fullDescription: body.fullDescription || body.description || '',
      price: Number(body.price),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      categoryId: body.categoryId,
      image: body.image || 'https://picsum.photos/seed/product/400/400',
      images: body.images?.length ? body.images : [body.image || 'https://picsum.photos/seed/product/400/400'],
      features: body.features || [],
      specifications: body.specifications || {},
      rating: Number(body.rating) || 5,
      inStock: body.inStock !== false,
      badge: body.badge || null,
    };
    data.products.push(product);
    return data;
  });

  res.status(201).json(created.products[created.products.length - 1]);
});

router.put('/products/:id', async (req, res) => {
  const updated = await updateDb((data) => {
    const idx = data.products.findIndex((p) => p.id === Number(req.params.id));
    if (idx === -1) throw new Error('NOT_FOUND');
    const prev = data.products[idx];
    data.products[idx] = {
      ...prev,
      ...req.body,
      id: Number(req.params.id),
      price: req.body.price != null ? Number(req.body.price) : prev.price,
      oldPrice: req.body.oldPrice != null ? (req.body.oldPrice ? Number(req.body.oldPrice) : null) : prev.oldPrice,
    };
    return data;
  });
  res.json(updated.products.find((p) => p.id === Number(req.params.id)));
});

router.delete('/products/:id', async (req, res) => {
  await updateDb((data) => {
    data.products = data.products.filter((p) => p.id !== Number(req.params.id));
    return data;
  });
  res.json({ ok: true });
});

// --- Wheel ---
router.get('/wheel', async (_req, res) => {
  const db = await readDb();
  res.json(db.wheel);
});

router.put('/wheel', async (req, res) => {
  const updated = await updateDb((data) => {
    data.wheel = {
      ...data.wheel,
      enabled: req.body.enabled ?? data.wheel.enabled,
      minPurchaseAmount: req.body.minPurchaseAmount ?? data.wheel.minPurchaseAmount,
      prizes: req.body.prizes ?? data.wheel.prizes,
    };
    return data;
  });
  res.json(updated.wheel);
});

router.post('/wheel/prizes', async (req, res) => {
  const prize = req.body;
  if (!prize.label) return res.status(400).json({ error: 'label обязателен' });

  const updated = await updateDb((data) => {
    const newPrize = {
      id: prize.id || `p_${crypto.randomUUID().slice(0, 8)}`,
      label: prize.label,
      description: prize.description || '',
      type: prize.type || 'coupon',
      couponCode: prize.couponCode || null,
      probability: Number(prize.probability) || 0,
      color: prize.color || '#ff9000',
      image: prize.image || null,
      productId: prize.productId || null,
    };
    data.wheel.prizes.push(newPrize);
    return data;
  });
  res.status(201).json(updated.wheel);
});

router.put('/wheel/prizes/:id', async (req, res) => {
  const updated = await updateDb((data) => {
    const idx = data.wheel.prizes.findIndex((p) => p.id === req.params.id);
    if (idx === -1) throw new Error('NOT_FOUND');
    data.wheel.prizes[idx] = { ...data.wheel.prizes[idx], ...req.body, id: req.params.id };
    return data;
  });
  res.json(updated.wheel.prizes.find((p) => p.id === req.params.id));
});

router.delete('/wheel/prizes/:id', async (req, res) => {
  await updateDb((data) => {
    data.wheel.prizes = data.wheel.prizes.filter((p) => p.id !== req.params.id);
    return data;
  });
  res.json({ ok: true });
});

// --- Stats ---
router.get('/stats', async (_req, res) => {
  const db = await readDb();
  const totalTickets = Object.values(db.spinTickets).flat().length;
  const usedTickets = Object.values(db.spinTickets).flat().filter((t) => t.used).length;
  res.json({
    products: db.products.length,
    categories: db.categories.length,
    orders: db.orders.length,
    tickets: { total: totalTickets, used: usedTickets },
    wheelPrizes: db.wheel.prizes.length,
  });
});

export default router;
