import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import {
  DEFAULT_OPEN_DAYS_OF_MONTH,
  normalizeOpenDays,
} from "@mir-games/game-core";

/**
 * Env-based config. Secrets come only from the process environment / .env files.
 * Never hardcode TELEGRAM_BOT_TOKEN or other credentials here.
 *
 * Token aliases: TELEGRAM_BOT_TOKEN (canonical) or TELEGRAM_BOT_TOKEN_MQ (Cursor secret / fallback).
 */
export type BotConfig = {
  /** Present only when the Telegram bot process should start. */
  telegramBotToken: string | null;
  httpPort: number;
  corsOrigin: string;
  /**
   * Public HTTPS URL of the Mini App (WebApp menu button + inline buttons).
   * Telegram Bot API rejects non-HTTPS web_app URLs in production clients.
   */
  miniappUrl: string | null;
  /**
   * Championship open days of month (1–31). Stub override via CHAMPIONSHIP_OPEN_DAYS
   * (comma-separated, or `*` for all days). No secrets.
   */
  championshipOpenDays: number[];
};

/** Absolute path to the npm package root (`apps/bot-server`). */
export function botServerPackageRoot(
  fromUrl: string = import.meta.url,
): string {
  // src/config.ts → .. ; dist/config.js → ..
  return path.resolve(path.dirname(fileURLToPath(fromUrl)), "..");
}

/** Absolute path to the monorepo root (contains root `.env`). */
export function monorepoRoot(fromUrl: string = import.meta.url): string {
  return path.resolve(botServerPackageRoot(fromUrl), "../..");
}

/**
 * Load env files before reading process.env.
 * Always loads monorepo-root `.env` (so `npm run bot:dev` from apps/bot-server cwd still works),
 * then optional `apps/bot-server/.env` for local overrides (does not override existing keys).
 */
export function loadEnvFiles(fromUrl: string = import.meta.url): void {
  const root = monorepoRoot(fromUrl);
  const pkg = botServerPackageRoot(fromUrl);
  loadDotenv({ path: path.join(root, ".env") });
  loadDotenv({ path: path.join(pkg, ".env") });
}

/**
 * Resolve Telegram bot token: TELEGRAM_BOT_TOKEN wins; else TELEGRAM_BOT_TOKEN_MQ.
 * When only MQ is set, maps it onto TELEGRAM_BOT_TOKEN on the given env object.
 */
export function resolveTelegramBotToken(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const canonical = env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const mq = env.TELEGRAM_BOT_TOKEN_MQ?.trim() || "";
  if (canonical) {
    return canonical;
  }
  if (mq) {
    env.TELEGRAM_BOT_TOKEN = mq;
    return mq;
  }
  return null;
}

function parseOpenDays(raw: string | undefined): number[] {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === "*") {
    return [...DEFAULT_OPEN_DAYS_OF_MONTH];
  }
  const parts = trimmed.split(/[,:\s]+/).filter(Boolean);
  return normalizeOpenDays(parts.map((p) => Number(p)));
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const telegramBotToken = resolveTelegramBotToken(env);
  const httpPort = Number(env.HTTP_PORT ?? "8787");
  const corsOrigin = env.CORS_ORIGIN?.trim() || "*";
  const miniappUrl = env.MINIAPP_URL?.trim() || null;
  const championshipOpenDays = parseOpenDays(env.CHAMPIONSHIP_OPEN_DAYS);

  if (!Number.isFinite(httpPort) || httpPort <= 0) {
    throw new Error("HTTP_PORT must be a positive number");
  }

  return { telegramBotToken, httpPort, corsOrigin, miniappUrl, championshipOpenDays };
}
