# Telegram Mini App — Web Shop

Мобильный веб-магазин для Telegram Mini App. Стек: **Express (Node.js)** + **Vue 3** + **MySQL**.

## Структура проекта

```
ParHub/
├── docker-compose.yml    # Production: backend + frontend(nginx) + MySQL + phpMyAdmin
├── .env.example          # Переменные окружения для Docker
├── backend/
│   ├── Dockerfile
│   └── src/
│       ├── db/           # MySQL pool, init, query functions
│       ├── routes/       # API + admin
│       ├── middleware/   # Telegram + admin auth
│       ├── data/         # seed.js — начальные данные
│       └── utils/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf        # SPA + /api proxy → backend
    └── src/
        ├── views/        # Shop + admin views
        ├── components/
        └── stores/       # Pinia
```

## Быстрый старт (Docker)

```bash
cp .env.example .env
# Отредактируй .env — вставь BOT_TOKEN и смени пароли

docker compose up -d --build
```

| Сервис | URL |
|--------|-----|
| Магазин | http://localhost |
| Админка | http://localhost/admin/login |
| phpMyAdmin | http://localhost:8080 |

Токен по умолчанию: значение `ADMIN_TOKEN` из `.env` (по умолчанию `admin123`).

## Локальная разработка (без Docker)

### Backend

```bash
cd backend
cp .env.example .env
# Укажи реквизиты локального MySQL в .env
npm install
npm run dev
```

При старте backend автоматически создаёт таблицы и засевает начальные данные.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Магазин: http://localhost:5173
- Vite proxy автоматически перенаправляет `/api` → `localhost:3001`

## Переменные окружения

Корневой `.env` (для Docker):

```
DB_ROOT_PASSWORD=rootsecret
DB_NAME=parhub
DB_USER=parhub
DB_PASSWORD=parhub123

BOT_TOKEN=your_telegram_bot_token_here
ADMIN_TOKEN=change_me_in_production

APP_PORT=80
PHPMYADMIN_PORT=8080
```

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tabs` | Вкладки навигации |
| GET | `/api/products` | Товары с фильтрами |
| POST | `/api/orders/checkout` | Оформление заказа |
| GET | `/api/wheel/config` | Настройки колеса |
| POST | `/api/wheel/spin` | Прокрутка (нужен билет) |
| GET | `/api/export/products` | Экспорт каталога (ключ `EXPORT_API_KEY`) |
| GET | `/api/export/categories` | Экспорт категорий (ключ `EXPORT_API_KEY`) |
| * | `/api/admin/*` | Админ API (Bearer token) |

## Экспорт каталога для других сервисов

Чтобы внешние сервисы не ходили в API МойСклад напрямую (лимиты), они могут забирать каталог из этого бэкенда:

```bash
curl -H "X-API-Key: $EXPORT_API_KEY" https://parhub-shop.ru/api/export/products
```

- Ключ задаётся переменной `EXPORT_API_KEY`, передаётся в заголовке `X-API-Key` (или query-параметром `?api_key=`). Если ключ не задан — эндпоинты отвечают `503`.
- Ответ: `{ "total": N, "items": [...] }`. У каждого товара есть `externalId` — UUID товара в МойСклад.
- Ссылки на изображения указывают на наш кэширующий прокси (`/api/ms-image`), а не на api.moysklad.ru.
- Фильтры: `?category=<id>`, `?search=<строка>`, `?inStock=true`.

## Колесо фортуны

- При заказе от **10 000 ₽** пользователь получает билет на прокрутку
- Анимированное SVG-колесо с секторами призов
- Призы и вероятности настраиваются в админке

## Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Укажите `BOT_TOKEN` в `.env`
3. Настройте Mini App URL в BotFather (URL сервера)
4. Для локальной разработки — HTTPS-туннель (ngrok)
