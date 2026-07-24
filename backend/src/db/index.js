import crypto from 'crypto';
import { pool } from './pool.js';

// --- Row mappers ---

function tabFromRow(r) {
  return { id: r.id, label: r.label, icon: r.icon, path: r.path, order: r.order, visible: Boolean(r.visible) };
}

function categoryFromRow(r) {
  return { id: r.id, name: r.name, icon: r.icon, order: r.order };
}

function productFromRow(r) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    fullDescription: r.full_description,
    price: Number(r.price),
    oldPrice: r.old_price != null ? Number(r.old_price) : null,
    categoryId: r.category_id,
    image: r.image,
    images: r.images || [],
    features: r.features || [],
    specifications: r.specifications || {},
    rating: Number(r.rating),
    inStock: Boolean(r.in_stock),
    badge: r.badge || null,
    externalId: r.external_id || null,
  };
}

function userFromRow(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    username: r.username,
    languageCode: r.language_code,
    photoUrl: r.photo_url || null,
    channelSubscribed: r.channel_subscribed,
    firstSeen: r.first_seen,
    lastSeen: r.last_seen,
  };
}

function orderFromRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    items: r.items || [],
    total: Number(r.total),
    status: r.status || 'new',
    msOrderId: r.ms_order_id || null,
    createdAt: r.created_at,
    userName: r.user_name || null,
    userUsername: r.user_username || null,
  };
}

function ticketFromRow(r) {
  return { id: r.id, userId: r.user_id, orderId: r.order_id, used: Boolean(r.used), createdAt: r.created_at };
}

function prizeFromRow(r) {
  return {
    id: r.id,
    label: r.label,
    description: r.description,
    type: r.type,
    couponCode: r.coupon_code,
    probability: Number(r.probability),
    color: r.color,
    image: r.image || null,
    productId: r.product_id || null,
  };
}

// --- Tabs ---

export async function getTabs() {
  const [rows] = await pool.query('SELECT * FROM tabs ORDER BY `order`');
  return rows.map(tabFromRow);
}

export async function getTabById(id) {
  const [rows] = await pool.query('SELECT * FROM tabs WHERE id = ?', [id]);
  return rows[0] ? tabFromRow(rows[0]) : null;
}

export async function createTab(tab) {
  await pool.query(
    'INSERT INTO tabs (id, label, icon, path, `order`, visible) VALUES (?, ?, ?, ?, ?, ?)',
    [tab.id, tab.label, tab.icon || 'grid', tab.path, tab.order ?? 0, tab.visible !== false ? 1 : 0],
  );
  return getTabById(tab.id);
}

export async function updateTab(id, data) {
  const sets = [];
  const vals = [];
  if (data.label !== undefined) { sets.push('label = ?'); vals.push(data.label); }
  if (data.icon !== undefined) { sets.push('icon = ?'); vals.push(data.icon); }
  if (data.path !== undefined) { sets.push('path = ?'); vals.push(data.path); }
  if (data.order !== undefined) { sets.push('`order` = ?'); vals.push(data.order); }
  if (data.visible !== undefined) { sets.push('visible = ?'); vals.push(data.visible ? 1 : 0); }
  if (sets.length) {
    vals.push(id);
    await pool.query(`UPDATE tabs SET ${sets.join(', ')} WHERE id = ?`, vals);
  }
  return getTabById(id);
}

export async function deleteTab(id) {
  await pool.query('DELETE FROM tabs WHERE id = ?', [id]);
}

// --- Categories ---

export async function getCategories() {
  const [rows] = await pool.query('SELECT * FROM categories ORDER BY `order`');
  return rows.map(categoryFromRow);
}

export async function getCategoryById(id) {
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] ? categoryFromRow(rows[0]) : null;
}

export async function createCategory(cat) {
  await pool.query(
    'INSERT INTO categories (id, name, icon, `order`) VALUES (?, ?, ?, ?)',
    [cat.id, cat.name, cat.icon || '📦', cat.order ?? 0],
  );
  return getCategoryById(cat.id);
}

export async function updateCategory(id, data) {
  const sets = [];
  const vals = [];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.icon !== undefined) { sets.push('icon = ?'); vals.push(data.icon); }
  if (data.order !== undefined) { sets.push('`order` = ?'); vals.push(data.order); }
  if (sets.length) {
    vals.push(id);
    await pool.query(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, vals);
  }
  return getCategoryById(id);
}

export async function deleteCategory(id) {
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
}

export async function categoryHasProducts(categoryId) {
  const [[{ cnt }]] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?',
    [categoryId],
  );
  return Number(cnt) > 0;
}

// --- Products ---

export async function getProducts({ category, search, sort, inStock } = {}) {
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    sql += ' AND category_id = ?';
    params.push(category);
  }
  if (inStock === 'true') {
    sql += ' AND in_stock = 1';
  }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR full_description LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  switch (sort) {
    case 'price_asc':  sql += ' ORDER BY price ASC';  break;
    case 'price_desc': sql += ' ORDER BY price DESC'; break;
    case 'rating':     sql += ' ORDER BY rating DESC'; break;
    default:           sql += ' ORDER BY id ASC';     break;
  }

  const [rows] = await pool.query(sql, params);
  return rows.map(productFromRow);
}

export async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(id)]);
  return rows[0] ? productFromRow(rows[0]) : null;
}

export async function createProduct(body) {
  const image = body.image || 'https://picsum.photos/seed/product/400/400';
  const images = body.images?.length ? body.images : [image];
  const [result] = await pool.query(
    `INSERT INTO products
       (name, description, full_description, price, old_price, category_id,
        image, images, features, specifications, rating, in_stock, badge)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.name,
      body.description || '',
      body.fullDescription || body.description || '',
      Number(body.price),
      body.oldPrice ? Number(body.oldPrice) : null,
      body.categoryId,
      image,
      JSON.stringify(images),
      JSON.stringify(body.features || []),
      JSON.stringify(body.specifications || {}),
      Number(body.rating) || 5,
      body.inStock !== false ? 1 : 0,
      body.badge || null,
    ],
  );
  return getProductById(result.insertId);
}

export async function updateProduct(id, body) {
  const prev = await getProductById(id);
  if (!prev) return null;
  await pool.query(
    `UPDATE products
     SET name=?, description=?, full_description=?, price=?, old_price=?, category_id=?,
         image=?, images=?, features=?, specifications=?, rating=?, in_stock=?, badge=?
     WHERE id=?`,
    [
      body.name         ?? prev.name,
      body.description  ?? prev.description,
      body.fullDescription ?? prev.fullDescription,
      body.price   != null ? Number(body.price)   : prev.price,
      body.oldPrice != null ? (body.oldPrice ? Number(body.oldPrice) : null) : prev.oldPrice,
      body.categoryId   ?? prev.categoryId,
      body.image        ?? prev.image,
      JSON.stringify(body.images         ?? prev.images),
      JSON.stringify(body.features       ?? prev.features),
      JSON.stringify(body.specifications ?? prev.specifications),
      body.rating  != null ? Number(body.rating)  : prev.rating,
      body.inStock !== undefined ? (body.inStock ? 1 : 0) : (prev.inStock ? 1 : 0),
      body.badge   !== undefined ? (body.badge || null)   : prev.badge,
      Number(id),
    ],
  );
  return getProductById(id);
}

export async function deleteProduct(id) {
  await pool.query('DELETE FROM products WHERE id = ?', [Number(id)]);
}

// --- Users ---

export async function upsertUser(user) {
  await pool.query(
    `INSERT INTO users (id, first_name, last_name, username, language_code, photo_url)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       first_name    = VALUES(first_name),
       last_name     = VALUES(last_name),
       username      = VALUES(username),
       language_code = VALUES(language_code),
       photo_url     = VALUES(photo_url),
       last_seen     = CURRENT_TIMESTAMP`,
    [
      String(user.id),
      user.first_name || null,
      user.last_name  || null,
      user.username   || null,
      user.language_code || null,
      user.photo_url  || null,
    ],
  );
}

export async function getAllUsers() {
  const [rows] = await pool.query('SELECT * FROM users ORDER BY last_seen DESC');
  return rows.map(userFromRow);
}

export async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [String(id)]);
  return rows[0] ? userFromRow(rows[0]) : null;
}

export async function setChannelSubscribed(userId, subscribed) {
  await pool.query(
    'UPDATE users SET channel_subscribed = ? WHERE id = ?',
    [subscribed ? 1 : 0, String(userId)],
  );
}

// --- Orders ---

export async function getAllOrders() {
  const [rows] = await pool.query(`
    SELECT o.*, u.first_name AS user_name, u.username AS user_username
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    ORDER BY o.created_at DESC
  `);
  return rows.map(orderFromRow);
}

export async function getOrdersByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [String(userId)],
  );
  return rows.map(orderFromRow);
}

export async function createOrder(order) {
  const createdAt = new Date(order.createdAt).toISOString().slice(0, 19).replace('T', ' ');
  await pool.query(
    'INSERT INTO orders (id, user_id, items, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [order.id, order.userId, JSON.stringify(order.items), order.total, 'new', createdAt],
  );
}

export async function updateOrderStatus(id, status) {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
}

export async function deleteOrder(id) {
  await pool.query('DELETE FROM orders WHERE id = ?', [id]);
}

export async function setOrderMsId(id, msOrderId) {
  await pool.query('UPDATE orders SET ms_order_id = ? WHERE id = ?', [msOrderId, id]);
}

// --- Spin tickets ---

export async function getAvailableTickets(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM spin_tickets WHERE user_id = ? AND used = 0',
    [String(userId)],
  );
  return rows.map(ticketFromRow);
}

export async function createTicket(ticket) {
  const createdAt = new Date(ticket.createdAt).toISOString().slice(0, 19).replace('T', ' ');
  await pool.query(
    'INSERT INTO spin_tickets (id, user_id, order_id, used, created_at) VALUES (?, ?, ?, 0, ?)',
    [ticket.id, ticket.userId, ticket.orderId, createdAt],
  );
}

export async function useTicket(ticketId) {
  await pool.query('UPDATE spin_tickets SET used = 1 WHERE id = ?', [ticketId]);
}

export async function getTicketByOrderId(orderId) {
  const [rows] = await pool.query('SELECT id FROM spin_tickets WHERE order_id = ?', [orderId]);
  return rows[0] || null;
}

// --- Spin results ---

export async function createSpinResult(userId, prize) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
  await pool.query(
    'INSERT INTO spin_results (id, user_id, prize_data, created_at) VALUES (?, ?, ?, ?)',
    [id, String(userId), JSON.stringify(prize), createdAt],
  );
}

export async function getSpinResults(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM spin_results WHERE user_id = ? ORDER BY created_at DESC',
    [String(userId)],
  );
  return rows.map((r) => ({
    id: r.id,
    prize: typeof r.prize_data === 'string' ? JSON.parse(r.prize_data) : r.prize_data,
    createdAt: r.created_at,
  }));
}

// --- Wheel ---

export async function getWheelConfig() {
  const [[cfgRows], [prizeRows]] = await Promise.all([
    pool.query('SELECT * FROM wheel_config WHERE id = 1'),
    pool.query('SELECT * FROM wheel_prizes ORDER BY id'),
  ]);
  if (!cfgRows[0]) return null;
  return {
    enabled: Boolean(cfgRows[0].enabled),
    minPurchaseAmount: Number(cfgRows[0].min_purchase_amount),
    prizes: prizeRows.map(prizeFromRow),
  };
}

export async function updateWheelConfig({ enabled, minPurchaseAmount }) {
  const sets = [];
  const vals = [];
  if (enabled !== undefined) { sets.push('enabled = ?'); vals.push(enabled ? 1 : 0); }
  if (minPurchaseAmount !== undefined) { sets.push('min_purchase_amount = ?'); vals.push(Number(minPurchaseAmount)); }
  if (sets.length) {
    vals.push(1);
    await pool.query(`UPDATE wheel_config SET ${sets.join(', ')} WHERE id = ?`, vals);
  }
}

export async function getPrizeById(id) {
  const [rows] = await pool.query('SELECT * FROM wheel_prizes WHERE id = ?', [id]);
  return rows[0] ? prizeFromRow(rows[0]) : null;
}

export async function createPrize(prize) {
  await pool.query(
    `INSERT INTO wheel_prizes
       (id, label, description, type, coupon_code, probability, color, image, product_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      prize.id, prize.label, prize.description || '', prize.type || 'coupon',
      prize.couponCode || null, Number(prize.probability) || 0,
      prize.color || '#ff9000', prize.image || null, prize.productId || null,
    ],
  );
  return getPrizeById(prize.id);
}

export async function updatePrize(id, data) {
  const prev = await getPrizeById(id);
  if (!prev) return null;
  await pool.query(
    `UPDATE wheel_prizes
     SET label=?, description=?, type=?, coupon_code=?, probability=?, color=?, image=?, product_id=?
     WHERE id=?`,
    [
      data.label       ?? prev.label,
      data.description ?? prev.description,
      data.type        ?? prev.type,
      data.couponCode  ?? prev.couponCode,
      data.probability != null ? Number(data.probability) : prev.probability,
      data.color       ?? prev.color,
      data.image       ?? prev.image,
      data.productId   ?? prev.productId,
      id,
    ],
  );
  return getPrizeById(id);
}

export async function deletePrize(id) {
  await pool.query('DELETE FROM wheel_prizes WHERE id = ?', [id]);
}

export async function replaceWheelPrizes(prizes) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM wheel_prizes');
    for (const p of prizes) {
      await conn.query(
        `INSERT INTO wheel_prizes
           (id, label, description, type, coupon_code, probability, color, image, product_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.label, p.description || '', p.type || 'coupon',
          p.couponCode || null, Number(p.probability) || 0,
          p.color || '#ff9000', p.image || null, p.productId || null,
        ],
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// --- Loyalty levels ---

function levelFromRow(r) {
  return {
    id: r.id,
    name: r.name,
    minAmount: Number(r.min_amount),
    badge: r.badge,
    perk: r.perk || null,
    color: r.color || '#ff9000',
    sortOrder: r.sort_order,
  };
}

export async function getLoyaltyLevels() {
  const [rows] = await pool.query('SELECT * FROM loyalty_levels ORDER BY min_amount ASC');
  return rows.map(levelFromRow);
}

export async function getLoyaltyLevelById(id) {
  const [rows] = await pool.query('SELECT * FROM loyalty_levels WHERE id = ?', [id]);
  return rows[0] ? levelFromRow(rows[0]) : null;
}

export async function createLoyaltyLevel(data) {
  const [result] = await pool.query(
    'INSERT INTO loyalty_levels (name, min_amount, badge, perk, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [data.name, Number(data.minAmount) || 0, data.badge || '⭐', data.perk || null, data.color || '#ff9000', Number(data.sortOrder) || 0],
  );
  return getLoyaltyLevelById(result.insertId);
}

export async function updateLoyaltyLevel(id, data) {
  await pool.query(
    'UPDATE loyalty_levels SET name=?, min_amount=?, badge=?, perk=?, color=?, sort_order=? WHERE id=?',
    [data.name, Number(data.minAmount) || 0, data.badge || '⭐', data.perk || null, data.color || '#ff9000', Number(data.sortOrder) || 0, id],
  );
  return getLoyaltyLevelById(id);
}

export async function deleteLoyaltyLevel(id) {
  await pool.query('DELETE FROM loyalty_levels WHERE id = ?', [id]);
}

export function resolveLoyaltyLevel(levels, totalSpent) {
  const sorted = [...levels].sort((a, b) => b.minAmount - a.minAmount);
  return sorted.find(l => totalSpent >= l.minAmount) || null;
}

// --- Stats ---

export async function getStats() {
  const results = await Promise.all([
    pool.query('SELECT COUNT(*) AS cnt FROM products'),
    pool.query('SELECT COUNT(*) AS cnt FROM categories'),
    pool.query('SELECT COUNT(*) AS cnt FROM orders'),
    pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(used), 0) AS used FROM spin_tickets'),
    pool.query('SELECT COUNT(*) AS cnt FROM wheel_prizes'),
  ]);
  const [products, categories, orders, tickets, prizes] = results.map(([rows]) => rows[0]);
  return {
    products:    Number(products.cnt),
    categories:  Number(categories.cnt),
    orders:      Number(orders.cnt),
    tickets:     { total: Number(tickets.total), used: Number(tickets.used) },
    wheelPrizes: Number(prizes.cnt),
  };
}
