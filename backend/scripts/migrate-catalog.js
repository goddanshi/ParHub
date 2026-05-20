import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultData } from '../src/data/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/db.json');

async function migrate() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
  } catch {
    /* fresh install */
  }

  const db = {
    ...defaultData,
    tabs: existing.tabs?.length ? existing.tabs : defaultData.tabs,
    orders: existing.orders || [],
    spinTickets: existing.spinTickets || {},
    nextProductId: defaultData.nextProductId,
  };

  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));

  const { invalidateCache } = await import('../src/data/store.js');
  invalidateCache();

  console.log('Catalog migrated to vape theme');
}

migrate();
