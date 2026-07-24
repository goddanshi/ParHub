import { pool } from '../db/pool.js';
import { fetchFolders, fetchProducts, fetchStockMap, fetchByHref, fetchProductStock, fetchProductImages } from './moysklad.js';

// Последний результат синхронизации (хранится в памяти)
let lastSyncResult = null;
let syncRunning = false;

export function getSyncStatus() {
  return { running: syncRunning, last: lastSyncResult };
}

// Извлечь UUID из href МойСклад
function hrefId(href) {
  return href?.split('/').pop()?.split('?')[0] ?? null;
}

// Извлечь URL изображения из объекта изображения МойСклад
// Храним meta.href — прокси попробует получить оригинал через /download/{uuid}
function imageUrl(imgRow) {
  return imgRow?.meta?.href        // ресурс изображения — прокси найдёт оригинал
    || imgRow?.miniature?.href     // резервный вариант — превью
    || imgRow?.miniature?.downloadHref
    || null;
}

export async function runSync() {
  if (syncRunning) return { skipped: true, reason: 'Синхронизация уже запущена' };
  syncRunning = true;

  const startedAt = new Date().toISOString();
  let categoriesSynced = 0;
  let productsSynced = 0;
  let imagesTotal = 0;
  let imagesFound = 0;
  let errors = [];

  try {
    console.log('[sync] Запуск синхронизации с МойСклад...');

    // 1. Категории
    const folders = await fetchFolders();
    for (const f of folders) {
      const externalId = hrefId(f.meta.href);
      try {
        await pool.query(
          `INSERT INTO categories (id, name, icon, \`order\`, external_id)
           VALUES (?, ?, '📦', 0, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [externalId, f.name, externalId],
        );
        categoriesSynced++;
      } catch (err) {
        errors.push(`Категория ${f.name}: ${err.message}`);
      }
    }

    // 2. Остатки
    const stockMap = await fetchStockMap();

    // 3. Товары
    const products = await fetchProducts();

    for (const p of products) {
      if (p.archived) continue;

      const externalId = hrefId(p.meta.href);
      const categoryExternalId = p.productFolder ? hrefId(p.productFolder.meta.href) : null;

      // Цена: МойСклад хранит в копейках → рубли
      const price = p.salePrices?.[0]?.value != null
        ? p.salePrices[0].value / 100
        : 0;

      // Остаток: смотрим stockMap по href товара
      const productHref = p.meta.href.split('?')[0];
      const stockQty = stockMap.get(productHref);
      const inStock = stockQty === undefined ? true : stockQty > 0;

      // Изображение: сохраняем URL МойСклад, отдаём через proxy
      let imagePath = null;
      const imagesSize = p.images?.meta?.size ?? 0;

      if (imagesSize > 0) {
        imagesTotal++;
        const [[existing]] = await pool.query(
          'SELECT image FROM products WHERE external_id = ?',
          [externalId],
        );
        if (existing?.image) {
          // Уже есть URL — оставляем
          imagePath = existing.image;
          imagesFound++;
        } else {
          const imgs = await fetchProductImages(productHref);
          imagePath = imgs.length > 0 ? imageUrl(imgs[0]) : null;
          if (imagePath) imagesFound++;
        }
      }

      try {
        await pool.query(
          `INSERT INTO products
             (name, description, full_description, price, category_id,
              image, images, features, specifications, rating, in_stock, badge, external_id)
           VALUES (?, ?, ?, ?, ?, ?, '[]', '[]', '{}', 5.0, ?, NULL, ?)
           ON DUPLICATE KEY UPDATE
             name         = VALUES(name),
             description  = VALUES(description),
             price        = VALUES(price),
             category_id  = VALUES(category_id),
             in_stock     = VALUES(in_stock),
             image        = IF(VALUES(image) IS NOT NULL, VALUES(image), image)`,
          [
            p.name,
            p.description || '',
            p.description || '',
            price,
            categoryExternalId,
            imagePath,
            inStock ? 1 : 0,
            externalId,
          ],
        );
        productsSynced++;
      } catch (err) {
        const msg = `Товар ${p.name}: ${err.message}`;
        errors.push(msg);
        if (errors.length <= 5) console.error('[sync]', msg);
      }
    }

    console.log(`[sync] Готово: ${productsSynced} товаров, ${categoriesSynced} категорий, фото: ${imagesFound}/${imagesTotal}, ошибок: ${errors.length}`);

    lastSyncResult = {
      startedAt,
      finishedAt: new Date().toISOString(),
      categoriesSynced,
      productsSynced,
      imagesFound,
      imagesTotal,
      errors,
      ok: errors.length === 0,
    };
  } catch (err) {
    lastSyncResult = {
      startedAt,
      finishedAt: new Date().toISOString(),
      categoriesSynced,
      productsSynced,
      errors: [err.message],
      ok: false,
    };
    console.error('[sync] Критическая ошибка:', err.message);
  } finally {
    syncRunning = false;
  }

  return lastSyncResult;
}

// --- Одиночные операции для вебхуков ---

async function upsertProduct(p) {
  if (!p || p.archived) {
    if (p) {
      const externalId = hrefId(p.meta.href);
      await pool.query('UPDATE products SET in_stock = 0 WHERE external_id = ?', [externalId]);
    }
    return;
  }

  const externalId = hrefId(p.meta.href);
  const categoryExternalId = p.productFolder ? hrefId(p.productFolder.meta.href) : null;
  const price = p.salePrices?.[0]?.value != null ? p.salePrices[0].value / 100 : 0;

  const inStock = await fetchProductStock(p.meta.href);

  let imagePath = null;
  if ((p.images?.meta?.size ?? 0) > 0) {
    const imgs = await fetchProductImages(p.meta.href.split('?')[0]);
    imagePath = imgs.length > 0 ? imageUrl(imgs[0]) : null;
    if (!imagePath) {
      const [[existing]] = await pool.query(
        'SELECT image FROM products WHERE external_id = ?', [externalId],
      );
      imagePath = existing?.image ?? null;
    }
  }

  await pool.query(
    `INSERT INTO products
       (name, description, full_description, price, category_id,
        image, images, features, specifications, rating, in_stock, badge, external_id)
     VALUES (?, ?, ?, ?, ?, ?, '[]', '[]', '{}', 5.0, ?, NULL, ?)
     ON DUPLICATE KEY UPDATE
       name        = VALUES(name),
       description = VALUES(description),
       price       = VALUES(price),
       category_id = VALUES(category_id),
       in_stock    = IF(VALUES(in_stock) IS NOT NULL, VALUES(in_stock), in_stock),
       image       = IF(VALUES(image) IS NOT NULL, VALUES(image), image)`,
    [
      p.name, p.description || '', p.description || '',
      price, categoryExternalId, imagePath,
      inStock !== null ? (inStock ? 1 : 0) : null,
      externalId,
    ],
  );
}

// Вебхук: обновить/создать один товар
export async function webhookUpsertProduct(productHref) {
  try {
    const p = await fetchByHref(productHref);
    await upsertProduct(p);
    console.log(`[webhook] Товар обновлён: ${p.name}`);
  } catch (err) {
    console.error(`[webhook] Ошибка товара ${productHref}:`, err.message);
  }
}

// Вебхук: удалить товар (снимаем с продажи)
export async function webhookDeleteProduct(productHref) {
  try {
    const externalId = hrefId(productHref);
    await pool.query('UPDATE products SET in_stock = 0 WHERE external_id = ?', [externalId]);
    console.log(`[webhook] Товар снят с продажи: ${externalId}`);
  } catch (err) {
    console.error(`[webhook] Ошибка удаления ${productHref}:`, err.message);
  }
}

// Вебхук: обновить категорию
export async function webhookUpsertFolder(folderHref) {
  try {
    const f = await fetchByHref(folderHref);
    const externalId = hrefId(f.meta.href);
    await pool.query(
      `INSERT INTO categories (id, name, icon, \`order\`, external_id)
       VALUES (?, ?, '📦', 0, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name)`,
      [externalId, f.name, externalId],
    );
    console.log(`[webhook] Категория обновлена: ${f.name}`);
  } catch (err) {
    console.error(`[webhook] Ошибка категории ${folderHref}:`, err.message);
  }
}
