export const defaultData = {
  tabs: [
    { id: 'home',    label: 'Главная', icon: 'home',  path: '/',        order: 0, visible: true },
    { id: 'catalog', label: 'Каталог', icon: 'grid',  path: '/catalog', order: 1, visible: true },
    { id: 'cart',    label: 'Корзина', icon: 'cart',  path: '/cart',    order: 2, visible: true },
    { id: 'wheel',   label: 'Рулетка', icon: 'wheel', path: '/wheel',   order: 3, visible: true },
    { id: 'profile', label: 'Профиль', icon: 'user',  path: '/profile', order: 4, visible: true },
  ],
  categories: [],
  products: [],
  wheel: {
    enabled: true,
    minPurchaseAmount: 10000,
    prizes: [],
  },
  nextProductId: 1,
};
