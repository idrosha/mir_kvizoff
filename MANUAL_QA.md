# Manual QA checklist — Мир Квизов

Hand-test checklist for Andrew. Run bot-server + a client, tick as you go.  
No secrets required for stub flows. See also `apps/mobile-capacitor/README.md` and `apps/tv-web/README.md`.

## Setup

```bash
npm install
cp .env.example .env          # leave TELEGRAM_BOT_TOKEN empty for API-only
npm run bot:dev               # http://127.0.0.1:8787/health

# pick one client:
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run web:dev               # :5174
# npm run miniapp:dev         # :5173
# npm run mobile:dev          # :5175 (Capacitor web shell)
# npm run tv:dev              # :5176 (TV large UI + dpad)
```

Optional bot UX: set `TELEGRAM_BOT_TOKEN` or `TELEGRAM_BOT_TOKEN_MQ` in root `.env` (env only — never commit) and restart `bot:dev`.

### Telegram Mini App via bot (Andrew)

1. Put `TELEGRAM_BOT_TOKEN_MQ` (or `TELEGRAM_BOT_TOKEN`) in root `.env` / Cursor Environment secrets — never paste into chat.
2. Serve Mini App over **HTTPS** and set `MINIAPP_URL` to that URL (Telegram rejects plain `http://` for WebApp buttons). Local browser smoke can stay on `http://127.0.0.1:5173` without the bot.
3. `npm run bot:dev` + `npm run miniapp:dev` (tunnel → `MINIAPP_URL`).
4. In Telegram: `/start` → inline **Открыть Мир Квизов**; chat menu button **Играть**; `/single` → map, `/online` → mode picker, `/championship`, `/shop`, `/account`, `/settings`, `/leaders`.
5. Inside Mini App, confirm hub → map/solo, online 1v1, party open/closed (host live results), shop, championship, profile.

---

## Single player (10 countries, timer, block gate)

- [ ] Menu → **Одиночная игра** opens the map
- [ ] Map shows **10 countries** (Египет → … → Мексика); only level 1 unlocked at start
- [ ] Avatar is visible on map / play / result
- [ ] Start a level → **30 questions**, **~10 s** timer bar counts down per question
- [ ] Completing level N unlocks N+1 in the chain
- [ ] After levels 1–10 of a block: next block stays **locked** if block score sum **&lt; 1000**
- [ ] With block sum **≥ 1000**, next decade (11–20, …) unlocks (server is source of truth)
- [ ] Retry of a finished level requires a shop **попытка** credit (no free replay)

## Online — 1v1 + party rooms

- [ ] Menu → **Онлайн** → mode picker: **1 на 1** / **Комната для компании**
- [ ] 1v1: Find match (stub bot) or human queue; **3 rounds** (choice / multi / free-text)
- [ ] Avatar visible in 1v1 lobby and match; free-text graded on **server**
- [ ] Party: host creates **open** or **closed** room (max 30 players); host is **ведущий**
- [ ] Closed join by invite code; open join from public list
- [ ] Host dashboard shows **live** player scores; host advances rounds
- [ ] Players answer shared rounds; result screen shows party leaderboard
- [ ] Menu → **Лидеры** loads server online rating table

## Championship

- [ ] Menu → **Чемпионат** lobby loads status / prize pool
- [ ] **Вступить** with PaymentPort stub (`stub:` receipt) succeeds; fund increases
- [ ] Avatar visible on championship screens
- [ ] Play run (rounds) → finish → settle / winner stub path works
- [ ] Shop section **«Только за чемпионат»** unlocks after confirmed entry (not by points/money alone)

## Shop / account / avatar

- [ ] **Магазин**: buy standard cosmetic for points or stub money → **надеть** updates avatar
- [ ] Championship cosmetics stay locked without participation
- [ ] Buy **Повторная попытка уровня** → retry credit appears on **Аккаунт**
- [ ] **Аккаунт**: stats, display name edit, second-attempt counter, online rating
- [ ] **Настройки**: language + sound persist (server + local StoragePort cache)
- [ ] Avatar remains visible across single / online / championship

## Bot `/start` + WebApp entry

- [ ] With `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_TOKEN_MQ` **and** HTTPS `MINIAPP_URL`: `/start` shows inline WebApp button; chat menu **Играть** opens Mini App
- [ ] Commands `/single` `/online` `/championship` `/leaders` `/shop` `/account` `/settings` open Mini App (not «Скоро»)
- [ ] Without token: API-only mode still serves `/health` and client stub auth (`demo:…`)
- [ ] Without `MINIAPP_URL`: commands explain how to set it; no WebApp keyboard

## Phase 8 shells (smoke)

- [ ] `npm run mobile:dev` — same menu flows; purchases use `stub-play` (no Play keys)
- [ ] `npm run tv:dev` — large UI, safe-zone padding; Arrow keys move focus rings
- [ ] (Optional device) `npm run mobile:build && npm run mobile:cap:add && npm run mobile:cap:sync && npm run mobile:cap:open`

## Automated gates before merge

```bash
npm run typecheck
npm test
```
