---
name: project-overview
description: Общий обзор проекта — Telegram Mini App магазин, архитектура, стек, ключевые модули
metadata:
  type: project
---

# Telegram Mini App — Интернет-магазин

## Стек
- **Frontend**: Vue 3 (Composition API, Pinia, Vue Router), Vite, Nginx (в Docker)
- **Backend**: Node.js, Express, MySQL (mysql2), node-cron
- **Деплой**: Docker Compose, deploy.sh

## Архитектура

### Backend (`/backend`)
- `src/index.js` — точка входа, регистрация роутов, крон-синх МойСклад
- `src/db/init.js` — создание таблиц MySQL, seed данных
- `src/db/index.js` — функции запросов к БД
- `src/services/moysklad.js` — API-клиент МойСклад
- `src/services/sync.js` — синхронизация товаров/категорий из МойСклад, скачивание изображений в `/uploads`
- `src/middleware/telegramAuth.js` — верификация Telegram initData
- `src/middleware/adminAuth.js` — JWT-авторизация для админки

### Backend роуты (`/api/...`)
- `/auth` — верификация Telegram пользователя
- `/tabs` — навигационные вкладки
- `/categories` — категории товаров
- `/products` — каталог товаров (фильтр по категории, поиск, пагинация)
- `/users/me` — профиль текущего пользователя
- `/wheel` — колесо фортуны (конфиг, тикеты, спин)
- `/orders` — оформление заказа, история заказов
- `/admin/*` — CRUD для товаров, категорий, вкладок, колеса + статистика
- `/admin/sync` — ручной запуск синхронизации с МойСклад

### БД (MySQL) — таблицы
- `tabs` — навигационные вкладки приложения
- `categories` — категории товаров (с external_id от МойСклад)
- `products` — товары (с external_id от МойСклад, images/features/specifications как JSON)
- `orders` — заказы пользователей
- `spin_tickets` — билеты на колесо фортуны (выдаются при заказе от min_purchase_amount)
- `wheel_config` — конфиг колеса (enabled, min_purchase_amount)
- `wheel_prizes` — призы колеса (с вероятностями)

### Frontend (`/frontend`)
- Vue 3 + Pinia stores: auth, products, cart, tabs, wheel, admin
- Роуты: `/`, `/catalog`, `/product/:id`, `/cart`, `/wheel`, `/profile`, `/admin/*`
- `src/api/client.js` — единый API-клиент с Telegram initData в заголовках и admin Bearer token
- `src/composables/useTelegram.js` — интеграция с Telegram WebApp SDK

## Ключевые бизнес-сценарии
1. Пользователь открывает Mini App → авторизация через Telegram initData
2. Просмотр каталога товаров (фильтр по категориям/вкладкам, поиск)
3. Корзина → оформление заказа
4. При заказе от min_purchase_amount → выдаётся тикет на колесо фортуны
5. Вращение колеса фортуны → выигрыш приза (купон или товар)
6. Товары/категории синхронизируются из МойСклад по крону (каждые N минут)

## Интеграция МойСклад
- Токен через `MOYSKLAD_TOKEN` env переменную
- Синхронизируются папки (→ категории) и товары (цены в копейках → рубли)
- Изображения скачиваются в `/uploads/products/` и отдаются через static

**Why:** Автоматическая синхронизация каталога из учётной системы без ручного ввода

**How to apply:** При работе с товарами и категориями учитывать, что данные могут прийти из МойСклад и иметь `external_id`
