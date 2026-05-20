import { createRouter, createWebHistory } from 'vue-router';

import AdminLayout from '@/components/admin/AdminLayout.vue';
import AdminLogin from '@/views/admin/AdminLogin.vue';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import AdminTabs from '@/views/admin/AdminTabs.vue';
import AdminCategories from '@/views/admin/AdminCategories.vue';
import AdminProducts from '@/views/admin/AdminProducts.vue';
import AdminProductForm from '@/views/admin/AdminProductForm.vue';
import AdminWheel from '@/views/admin/AdminWheel.vue';

const shopRoutes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/catalog', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
  { path: '/product/:id', name: 'product', component: () => import('@/views/ProductView.vue') },
  { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue') },
  { path: '/wheel', name: 'wheel', component: () => import('@/views/WheelView.vue') },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
];

const adminRoutes = [
  { path: '/admin/login', name: 'admin-login', component: AdminLogin },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: AdminDashboard },
      { path: 'tabs', name: 'admin-tabs', component: AdminTabs },
      { path: 'categories', name: 'admin-categories', component: AdminCategories },
      { path: 'products/new', name: 'admin-product-new', component: AdminProductForm },
      { path: 'products/:id', name: 'admin-product-edit', component: AdminProductForm, props: true },
      { path: 'products', name: 'admin-products', component: AdminProducts },
      { path: 'wheel', name: 'admin-wheel', component: AdminWheel },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: [...shopRoutes, ...adminRoutes],
});

router.beforeEach((to, from, next) => {
  const isAdminRoute = to.path.startsWith('/admin') && to.name !== 'admin-login';
  const hasToken = !!localStorage.getItem('admin_token');

  if (isAdminRoute && !hasToken) {
    next('/admin/login');
  } else {
    next();
  }
});

export default router;
