# `apps/mobile-capacitor` — Capacitor Android shell (Phase 8)

Thin Capacitor wrapper around the same web UI + `game-core`. Platform differences live in `@mir-games/adapters-mobile` (HapticsPort + Play Billing **stub**). No fork of `game-core`. No real Play Billing / license keys.

## Prerequisites

- Node.js 20+
- For a native APK: Android Studio + SDK, JDK 21 recommended
- bot-server HTTP API (`npm run bot:dev` from repo root)

## Browser smoke (no Android SDK)

```bash
# terminal 1 — API
npm run bot:dev

# terminal 2 — Capacitor web shell (port 5175)
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run mobile:dev
# open http://127.0.0.1:5175
```

Demo player id: `demo:mobile-demo`. Purchases use PaymentPort provider `stub-play` (receipts `stub:…` confirmed by bot-server).

## Android build / run (manual QA)

```bash
# 1) Install workspace deps (from repo root)
npm install

# 2) Build the web assets Capacitor embeds
export VITE_API_BASE_URL=http://10.0.2.2:8787   # Android emulator → host loopback
# physical device: use your machine LAN IP, e.g. http://192.168.1.10:8787
npm run mobile:build

# 3) Generate the Android project once (creates apps/mobile-capacitor/android/)
npm run mobile:cap:add

# 4) Sync dist/ into the native project
npm run mobile:cap:sync

# 5) Open in Android Studio and Run on emulator/device
npm run mobile:cap:open
```

Equivalent from this package directory:

```bash
cd apps/mobile-capacitor
npm run build
npx cap add android          # first time only
npx cap sync android
npx cap open android
```

Notes:

- `android/` is generated locally and gitignored — do not commit Play signing keys or `local.properties`.
- Default API URL inside the shell is `http://10.0.2.2:8787` (emulator). Override with `VITE_API_BASE_URL` at build time.
- Haptics: Capacitor `Haptics` plugin when present; otherwise Vibration API / no-op.
- Billing: **stub only** (`stub-play`). Wire real Play Billing Library later behind the same `PaymentPort`.

## Typecheck

```bash
npm run typecheck -w @mir-games/mobile-capacitor
```
