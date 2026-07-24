const API_BASE = '/api';

function getHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) headers['X-Telegram-Init-Data'] = initData;
  const adminToken = localStorage.getItem('admin_token');
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
  return headers;
}

export async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: getHeaders(options.headers),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Ошибка запроса: ${response.status}`);
    }

    return response.json();
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('Превышено время ожидания. Проверьте, запущен ли backend.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  auth: {
    verify: () => apiFetch('/auth/verify', { method: 'POST' }),
    subscribe: () => apiFetch('/auth/subscribe', { method: 'POST' }),
  },
  tabs: {
    list: () => apiFetch('/tabs'),
  },
  categories: {
    list: () => apiFetch('/categories'),
  },
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
      ).toString();
      return apiFetch(`/products${query ? `?${query}` : ''}`);
    },
    get: (id) => apiFetch(`/products/${id}`),
  },
  users: {
    me: () => apiFetch('/users/me'),
  },
  wheel: {
    config: () => apiFetch('/wheel/config'),
    tickets: () => apiFetch('/wheel/tickets'),
    spin: () => apiFetch('/wheel/spin', { method: 'POST' }),
    prizes: () => apiFetch('/wheel/prizes'),
  },
  orders: {
    checkout: (items) =>
      apiFetch('/orders/checkout', { method: 'POST', body: JSON.stringify({ items }) }),
    list: () => apiFetch('/orders'),
  },
  admin: {
    login: (token) => {
      localStorage.setItem('admin_token', token);
      return apiFetch('/admin/stats');
    },
    logout: () => localStorage.removeItem('admin_token'),
    stats: () => apiFetch('/admin/stats'),
    tabs: {
      list: () => apiFetch('/admin/tabs'),
      create: (data) => apiFetch('/admin/tabs', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => apiFetch(`/admin/tabs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => apiFetch(`/admin/tabs/${id}`, { method: 'DELETE' }),
    },
    categories: {
      list: () => apiFetch('/admin/categories'),
      create: (data) => apiFetch('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => apiFetch(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => apiFetch(`/admin/categories/${id}`, { method: 'DELETE' }),
    },
    products: {
      list: () => apiFetch('/admin/products'),
      get: (id) => apiFetch(`/admin/products/${id}`),
      create: (data) => apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => apiFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => apiFetch(`/admin/products/${id}`, { method: 'DELETE' }),
    },
    sync: {
      status: () => apiFetch('/admin/sync/status'),
      run: () => apiFetch('/admin/sync/run', { method: 'POST' }),
    },
    orders: {
      list: () => apiFetch('/admin/orders'),
      setStatus: (id, status) => apiFetch(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
      delete: (id) => apiFetch(`/admin/orders/${id}`, { method: 'DELETE' }),
      sendToMs: (id) => apiFetch(`/admin/orders/${id}/send-to-ms`, { method: 'POST' }),
    },
    users: {
      list: () => apiFetch('/admin/users'),
      grantTicket: (id, count = 1) => apiFetch(`/admin/users/${id}/grant-ticket`, { method: 'POST', body: JSON.stringify({ count }) }),
    },
    levels: {
      list: () => apiFetch('/admin/levels'),
      create: (data) => apiFetch('/admin/levels', { method: 'POST', body: JSON.stringify(data) }),
      update: (id, data) => apiFetch(`/admin/levels/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id) => apiFetch(`/admin/levels/${id}`, { method: 'DELETE' }),
    },
    broadcast: {
      usersCount: () => apiFetch('/admin/broadcast/users-count'),
      send: (data) => apiFetch('/admin/broadcast', { method: 'POST', body: JSON.stringify(data) }),
    },
    wheel: {
      get: () => apiFetch('/admin/wheel'),
      update: (data) => apiFetch('/admin/wheel', { method: 'PUT', body: JSON.stringify(data) }),
      createPrize: (data) => apiFetch('/admin/wheel/prizes', { method: 'POST', body: JSON.stringify(data) }),
      updatePrize: (id, data) => apiFetch(`/admin/wheel/prizes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      deletePrize: (id) => apiFetch(`/admin/wheel/prizes/${id}`, { method: 'DELETE' }),
    },
  },
};
