import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { initDb } from './db/init.js';
import { runSync } from './services/sync.js';
import imageProxyRoute from './routes/imageProxy.js';
import authRoutes from './routes/auth.js';
import tabsRoutes from './routes/tabs.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import usersRoutes from './routes/users.js';
import wheelRoutes from './routes/wheel.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import syncRoutes from './routes/sync.js';
import webhookRoutes from './routes/webhook.js';
import telegramWebhookRoutes from './routes/telegramWebhook.js';
import exportRoutes from './routes/export.js';

// "*/N" в поле минут работает только для N < 60, поэтому большие интервалы переводим в часы
function cronFromMinutes(min) {
  if (min < 60) return `*/${min} * * * *`;
  const hours = Math.round(min / 60);
  return hours >= 24 ? '0 3 * * *' : `0 */${hours} * * *`;
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/ms-image', imageProxyRoute);

app.use('/api/auth', authRoutes);
app.use('/api/tabs', tabsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wheel', wheelRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/sync', syncRoutes);
app.use('/api/webhook/moysklad', webhookRoutes);
app.use('/api/webhook/telegram', telegramWebhookRoutes);
app.use('/api/export', exportRoutes);

app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

    // Крон-синхронизация с МойСклад
    if (process.env.MOYSKLAD_TOKEN) {
      const intervalMin = Math.max(5, Number(process.env.SYNC_INTERVAL_MINUTES) || 30);
      const cronExpr = cronFromMinutes(intervalMin);
      cron.schedule(cronExpr, () => runSync());
      console.log(`МойСклад sync scheduled: "${cronExpr}" (SYNC_INTERVAL_MINUTES=${intervalMin}, fallback cron)`);

      // Первая полная синхронизация через 10 секунд после старта
      setTimeout(() => runSync(), 10_000);
    } else {
      console.log('MOYSKLAD_TOKEN не задан — автосинхронизация отключена');
    }
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  });
