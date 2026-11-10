# Мир Квизов (`mir_games`)

Кроссплатформенные познавательные квизы: одно игровое ядро, платформы только в адаптерах. Клиенты — Telegram-бот + Mini App + Web + Capacitor Android shell + TV web.

## Структура (monorepo)

```
apps/
  bot-server/              # Telegram bot + HTTP API (прогресс, auth stub)
  telegram-miniapp/        # Telegram Mini App (Vite + React)
  web/                     # Browser web client (Vite + React)
  mobile-capacitor/        # Capacitor Android thin shell (Phase 8)
  tv-web/                  # TV / leanback thin client (Phase 8)
content/
  question-bank/           # банк вопросов сингл (JSON, блок 1: 10×30)
packages/
  platform-contracts/      # порты (TypeScript interfaces)
  game-core/               # правила квиза без DOM / Telegram / Capacitor
  question-bank/           # адаптер JSON → LevelDefinition + карта
  adapters-telegram/       # адаптеры портов для Mini App
  adapters-web/            # адаптеры портов для браузера
  adapters-mobile/         # Haptics + Play Billing stubs (Capacitor)
  adapters-tv/             # InputPort dpad/gamepad + safe-zone profile
```

Секреты (токен бота, GitHub secrets, Play Billing) хранятся **только в окружении / секретах CI**. Не коммитьте `.env` и не вставляйте реальные токены в код, README или историю git.

Ручной чеклист: [`MANUAL_QA.md`](./MANUAL_QA.md).

## Локальный запуск

Требования: Node.js 20+.

```bash
npm install
cp .env.example .env
# при желании: TELEGRAM_BOT_TOKEN=... или TELEGRAM_BOT_TOKEN_MQ=...
# (без токена поднимется только HTTP API; bot-server читает корневой .env)
```

### 1) HTTP API + опционально бот

```bash
npm run bot:dev
# API: http://127.0.0.1:8787/health
```

Без `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_TOKEN_MQ` процесс работает в режиме API-only (удобно для браузерного демо).

### 2) Web

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run web:dev
# открыть http://127.0.0.1:5174
```

Демо-потоки: чемпионат / онлайн / сингл (10 стран) / магазин / аккаунт — см. `MANUAL_QA.md`.

### 3) Mini App

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run miniapp:dev
# открыть http://127.0.0.1:5173  (браузерный демо-режим без Telegram)
```

#### Тест из Telegram-бота (`TELEGRAM_BOT_TOKEN_MQ`)

1. В корневом `.env` (или в секретах Cursor Environment) задайте:
   - `TELEGRAM_BOT_TOKEN_MQ=<токен бота>` — либо `TELEGRAM_BOT_TOKEN`
   - `MINIAPP_URL=https://…` — **публичный HTTPS** URL Mini App (Bot API не принимает `http://` для `web_app`)
   - `CORS_ORIGIN=*` (или origin вашего Mini App)
2. Поднимите API+бот: `npm run bot:dev`
3. Поднимите Mini App и пробросьте HTTPS-туннель на Vite, например:
   ```bash
   npm run miniapp:dev
   # в другом терминале: ngrok http 5173
   # затем MINIAPP_URL=https://….ngrok-free.app и перезапуск bot:dev
   ```
4. В чате с ботом: `/start` → кнопка **«Открыть Мир Квизов»**; меню чата **«Играть»**; команды `/single`, `/online`, `/shop`, … открывают Mini App с `?screen=`.
5. Токен **никогда** не коммитить и не вставлять в чат — только `.env` / Cursor secret `TELEGRAM_BOT_TOKEN_MQ`.

### 4) Capacitor Android shell (Phase 8)

Browser smoke (без Android SDK):

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run mobile:dev
# http://127.0.0.1:5175
```

Native (нужны Android Studio / SDK):

```bash
export VITE_API_BASE_URL=http://10.0.2.2:8787   # эмулятор → host
npm run mobile:build
npm run mobile:cap:add      # один раз — создаёт android/ (gitignored)
npm run mobile:cap:sync
npm run mobile:cap:open
```

Подробности: `apps/mobile-capacitor/README.md`. Billing — только `stub-play`, без Play Console ключей.

### 5) TV / Web (Phase 8)

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run tv:dev
# http://127.0.0.1:5176
```

Крупный UI, safe-zone ~5%, фокус стрелками / gamepad stub. Подробности: `apps/tv-web/README.md`.

### Проверки

```bash
npm run typecheck
npm test
```

## Безопасность

- Переменные: `TELEGRAM_BOT_TOKEN` (или `TELEGRAM_BOT_TOKEN_MQ`), `HTTP_PORT`, `CORS_ORIGIN`, `MINIAPP_URL`, `VITE_API_BASE_URL`, `CHAMPIONSHIP_OPEN_DAYS`
- Пример без значений: `.env.example`
- `.env` в `.gitignore` — не коммитить
- В клиенте секретов нет; Play Billing / Stars keys не кладём в репозиторий
