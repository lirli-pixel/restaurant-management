# Restaurant Management System

Полноценный учебный проект: NestJS + Vue 3 + Prisma + PostgreSQL + Redis + Docker.

## Требования
- Node.js 22+
- Docker Desktop (включая Docker Compose)
- Git (необязательно)
- VS Code (рекомендуется)

## Быстрый запуск
1. Установите Docker Desktop и запустите его.
2. Распакуйте архив и откройте папку `restaurant-management` в VS Code.
3. В терминале из корня проекта выполните:
   ```bash
   docker compose up --build
   ```
4. Откройте:
   - Клиентское приложение: http://localhost:5173
   - Swagger API: http://localhost:3000/api/docs
   - API: http://localhost:3000/api
5. Дождитесь завершения миграции и заполнения демонстрационных данных.

## Тестовые учётные записи
- Администратор: `admin@restaurant.local` / `Admin123!`
- Сотрудник: `staff@restaurant.local` / `Staff123!`
- Клиент: `client@restaurant.local` / `Client123!`

Смените пароли перед реальным использованием. Это учебный проект, не готовый к размещению с реальными персональными и платёжными данными.

## Если запускаете без Docker
1. Установите Node.js 22+, PostgreSQL и Redis.
2. В `backend/.env` задайте DATABASE_URL и REDIS_URL.
3. В `backend` выполните `npm install`, `npx prisma migrate dev --name init`, `npm run seed`, `npm run start:dev`.
4. В `frontend` выполните `npm install`, `npm run dev`.

## Основные возможности
- JWT-авторизация и роли ADMIN / STAFF / CLIENT.
- CRUD блюд и столиков.
- Бронирование с проверкой пересечения по времени.
- Заказы и позиции заказа.
- Аналитика выручки и количества бронирований.
- PostgreSQL через Prisma ORM, Redis-кэш меню.
- Swagger-документация.
- Серверная бизнес-логика, клиентское SPA.
