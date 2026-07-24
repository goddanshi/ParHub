import { pool } from './pool.js';
import { defaultData } from '../data/seed.js';

export async function initDb() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tabs (
        id      VARCHAR(50)  PRIMARY KEY,
        label   VARCHAR(255) NOT NULL,
        icon    VARCHAR(100),
        path    VARCHAR(255),
        \`order\` INT          DEFAULT 0,
        visible TINYINT(1)   DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          VARCHAR(50)  PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        icon        VARCHAR(100),
        \`order\`     INT          DEFAULT 0,
        external_id VARCHAR(36)  UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255)   NOT NULL,
        description      TEXT,
        full_description TEXT,
        price            DECIMAL(10,2)  NOT NULL,
        old_price        DECIMAL(10,2),
        category_id      VARCHAR(50),
        image            TEXT,
        images           JSON,
        features         JSON,
        specifications   JSON,
        rating           DECIMAL(3,1)   DEFAULT 5.0,
        in_stock         TINYINT(1)     DEFAULT 1,
        badge            VARCHAR(100),
        external_id      VARCHAR(255)   UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             VARCHAR(50)  PRIMARY KEY,
        first_name     VARCHAR(100),
        last_name      VARCHAR(100),
        username       VARCHAR(100),
        language_code  VARCHAR(10),
        photo_url      TEXT,
        first_seen     DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id         VARCHAR(36)   PRIMARY KEY,
        user_id    VARCHAR(50)   NOT NULL,
        items      JSON          NOT NULL,
        total      DECIMAL(10,2) NOT NULL,
        created_at DATETIME      DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS spin_tickets (
        id         VARCHAR(36) PRIMARY KEY,
        user_id    VARCHAR(50) NOT NULL,
        order_id   VARCHAR(36),
        used       TINYINT(1)  DEFAULT 0,
        created_at DATETIME    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS wheel_config (
        id                  INT           PRIMARY KEY,
        enabled             TINYINT(1)    DEFAULT 1,
        min_purchase_amount DECIMAL(10,2) DEFAULT 10000.00
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS wheel_prizes (
        id          VARCHAR(50)  PRIMARY KEY,
        label       VARCHAR(255) NOT NULL,
        description TEXT,
        type        VARCHAR(50)  DEFAULT 'coupon',
        coupon_code VARCHAR(100),
        probability DECIMAL(6,2) DEFAULT 0,
        color       VARCHAR(50)  DEFAULT '#ff9000',
        image       TEXT,
        product_id  INT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS spin_results (
        id         VARCHAR(36) PRIMARY KEY,
        user_id    VARCHAR(50) NOT NULL,
        prize_data JSON        NOT NULL,
        created_at DATETIME    DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS loyalty_levels (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        min_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        badge      VARCHAR(50)   NOT NULL DEFAULT '⭐',
        perk       TEXT,
        color      VARCHAR(50)   DEFAULT '#ff9000',
        sort_order INT           DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Миграция: channel_subscribed в users
    try {
      await conn.query('ALTER TABLE users ADD COLUMN channel_subscribed TINYINT(1) DEFAULT NULL');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
    }

    // Миграция: переименовать вкладку "Колесо" → "Рулетка"
    await conn.query(`UPDATE tabs SET label = 'Рулетка' WHERE id = 'wheel' AND label = 'Колесо'`);

    // Миграция: добавить status и ms_order_id в orders
    for (const [col, def] of [
      ['status', "VARCHAR(50) DEFAULT 'new'"],
      ['ms_order_id', 'VARCHAR(36)'],
    ]) {
      try {
        await conn.query(`ALTER TABLE orders ADD COLUMN ${col} ${def}`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      }
    }

    // Миграция: добавить external_id или расширить до VARCHAR(255)
    for (const table of ['products', 'categories']) {
      try {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN external_id VARCHAR(255) UNIQUE`);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          // Колонка уже есть — убедимся что размер достаточный
          await conn.query(`ALTER TABLE ${table} MODIFY COLUMN external_id VARCHAR(255)`);
        } else {
          throw err;
        }
      }
    }

    // Seed tabs
    for (const t of defaultData.tabs) {
      await conn.query(
        'INSERT IGNORE INTO tabs (id, label, icon, path, `order`, visible) VALUES (?, ?, ?, ?, ?, ?)',
        [t.id, t.label, t.icon, t.path, t.order, t.visible ? 1 : 0],
      );
    }

    // Seed categories и products только если МойСклад не настроен
    if (!process.env.MOYSKLAD_TOKEN) {
      for (const c of defaultData.categories) {
        await conn.query(
          'INSERT IGNORE INTO categories (id, name, icon, `order`) VALUES (?, ?, ?, ?)',
          [c.id, c.name, c.icon, c.order],
        );
      }

      const [[{ cnt }]] = await conn.query('SELECT COUNT(*) AS cnt FROM products');
      if (Number(cnt) === 0) {
        for (const p of defaultData.products) {
          await conn.query(
            `INSERT IGNORE INTO products
               (id, name, description, full_description, price, old_price, category_id,
                image, images, features, specifications, rating, in_stock, badge)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id, p.name, p.description, p.fullDescription || p.description,
              p.price, p.oldPrice || null, p.categoryId, p.image,
              JSON.stringify(p.images || [p.image]),
              JSON.stringify(p.features || []),
              JSON.stringify(p.specifications || {}),
              p.rating, p.inStock ? 1 : 0, p.badge || null,
            ],
          );
        }
        await conn.query(`ALTER TABLE products AUTO_INCREMENT = ${defaultData.nextProductId}`);
      }
    }

    // Seed wheel config
    await conn.query(
      'INSERT IGNORE INTO wheel_config (id, enabled, min_purchase_amount) VALUES (1, ?, ?)',
      [defaultData.wheel.enabled ? 1 : 0, defaultData.wheel.minPurchaseAmount],
    );

    // Seed wheel prizes
    for (const p of defaultData.wheel.prizes) {
      await conn.query(
        `INSERT IGNORE INTO wheel_prizes
           (id, label, description, type, coupon_code, probability, color, image, product_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.label, p.description, p.type,
          p.couponCode || null, p.probability, p.color,
          p.image || null, p.productId || null,
        ],
      );
    }

    console.log('Database ready');
  } finally {
    conn.release();
  }
}
