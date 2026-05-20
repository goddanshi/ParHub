import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readDb } from './data/store.js';
import authRoutes from './routes/auth.js';
import tabsRoutes from './routes/tabs.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import usersRoutes from './routes/users.js';
import wheelRoutes from './routes/wheel.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tabs', tabsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/wheel', wheelRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Init DB on startup
readDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
