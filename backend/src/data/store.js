import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/db.json');

let cache = null;

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(defaultData, null, 2));
  }
}

export async function readDb() {
  if (cache) return cache;
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    cache = JSON.parse(raw);
    return cache;
  } catch (err) {
    cache = null;
    console.error('DB read error:', err.message);
    throw new Error('Ошибка чтения базы данных');
  }
}

export async function writeDb(data) {
  cache = data;
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

export async function updateDb(updater) {
  const data = await readDb();
  const updated = await updater(structuredClone(data));
  await writeDb(updated);
  return updated;
}

export function invalidateCache() {
  cache = null;
}
