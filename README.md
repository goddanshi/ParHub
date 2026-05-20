# Telegram Mini App — Web Shop

Мобильный веб-магазин для Telegram Mini App. Стек: **Express (Node.js)** + **Vue 3**.

## Структура проекта

```
tgMiniApp/
├── backend/          # Express API-сервер
│   ├── data/         # db.json (создаётся автоматически)
│   └── src/
│       ├── routes/       # API + admin
│       ├── middleware/   # Telegram + admin auth
│       └── data/         # store, seed
└── frontend/         # Vue 3 SPA (магазин + админка)
    └── src/
        ├── views/        # Shop + admin views
        ├── components/   # UI, wheel, admin layout
        └── stores/       # Pinia
```

## Быстрый старт

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Магазин: http://localhost:5173
- Админка: http://localhost:5173/admin/login (токен по умолчанию: `admin123`)

## Админ-панель

| Раздел | Возможности |
|--------|-------------|
| **Вкладки** | Название, путь, иконка, порядок, видимость нижней навигации |
| **Категории** | CRUD категорий с иконками |
| **Товары** | Цена, фото, описание, полная карточка, характеристики, бейджи |
| **Колесо** | Призы-купоны, вероятности, мин. сумма покупки (10 000 ₽) |

## Колесо фортуны

- При заказе от **10 000 ₽** пользователь получает билет на прокрутку
- Анимированное SVG-колесо с секторами призов
- Призы — купоны со скидками и бонусами
- Вероятности настраиваются в админке

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tabs` | Вкладки навигации |
| GET | `/api/products` | Товары с фильтрами |
| POST | `/api/orders/checkout` | Оформление заказа |
| GET | `/api/wheel/config` | Настройки колеса |
| POST | `/api/wheel/spin` | Прокрутка (нужен билет) |
| * | `/api/admin/*` | Админ API (Bearer token) |

## Переменные окружения

```
PORT=3001
BOT_TOKEN=...
ADMIN_TOKEN=admin123
NODE_ENV=development
```

## Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Укажите `BOT_TOKEN` в `.env`
3. Настройте Mini App URL в BotFather
4. Для локальной разработки — HTTPS-туннель (ngrok)
