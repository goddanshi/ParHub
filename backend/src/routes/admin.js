import { Router } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../middleware/adminAuth.js';
import {
  getTabs, createTab, updateTab, deleteTab,
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, categoryHasProducts,
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getWheelConfig, updateWheelConfig, replaceWheelPrizes, createPrize, updatePrize, deletePrize,
  getStats,
} from '../db/index.js';

const router = Router();
router.use(adminAuth);

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
  res.json(await getProducts());
});

router.get('/products/:id', async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
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
  res.json(await getWheelConfig());
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

export default router;
