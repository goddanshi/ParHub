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
| * | `/api/admin/*` | Админ API (Bearer token) |

## Колесо фортуны

- При заказе от **10 000 ₽** пользователь получает билет на прокрутку
- Анимированное SVG-колесо с секторами призов
- Призы и вероятности настраиваются в админке

## Telegram Mini App

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Укажите `BOT_TOKEN` в `.env`
3. Настройте Mini App URL в BotFather (URL сервера)
4. Для локальной разработки — HTTPS-туннель (ngrok)
