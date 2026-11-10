# `apps/tv-web` — TV / Web leanback shell (Phase 8)

Thin TV build of the same web UI + `game-core`. Platform differences live in `@mir-games/adapters-tv` (InputPort dpad/gamepad stubs, safe-zone capability profile, large-UI CSS). No fork of `game-core`.

## Prerequisites

- Node.js 20+
- bot-server HTTP API (`npm run bot:dev` from repo root)

## Dev / manual QA

```bash
# terminal 1 — API
npm run bot:dev

# terminal 2 — TV shell (port 5176)
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run tv:dev
# open http://127.0.0.1:5176
```

Demo player id: `demo:tv-demo`.

### Remote / gamepad smoke

- Arrow keys / D-pad move focus among `[data-tv-focusable]` controls
- Enter / Space activate the focused control (native button behaviour)
- Escape / Back emits InputPort `back` (stub — shell does not yet pop routes)
- Gamepad (standard mapping): dpad + A confirm + B back — polled stub in adapters-tv
- Safe zones: ~5% inset via `--tv-safe-*` CSS variables (overscan)

### Production-ish preview

```bash
export VITE_API_BASE_URL=http://127.0.0.1:8787
npm run tv:build
npm run preview -w @mir-games/tv-web
```

## Typecheck

```bash
npm run typecheck -w @mir-games/tv-web
```
