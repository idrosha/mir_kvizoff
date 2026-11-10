import { InlineKeyboard } from "grammy";

/** Deep-link screen ids accepted by telegram-miniapp (`?screen=` / start_param). */
export type MiniappScreen =
  | "menu"
  | "map"
  | "online"
  | "party"
  | "championship"
  | "leaders"
  | "shop"
  | "account"
  | "settings";

/**
 * Build a Mini App URL with optional `screen` query for client deep-link.
 * Telegram WebApp buttons require HTTPS (except special local Telegram Desktop setups).
 */
export function buildMiniappUrl(
  baseUrl: string,
  screen?: MiniappScreen,
): string {
  const url = new URL(baseUrl);
  if (screen && screen !== "menu") {
    url.searchParams.set("screen", screen);
  } else {
    url.searchParams.delete("screen");
  }
  return url.toString();
}

/** True when URL looks like something Telegram may accept for web_app buttons. */
export function isLikelyWebAppUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol === "https:") {
      return true;
    }
    // Local HTTP is useful for API docs / Desktop experiments; Bot API often rejects it.
    if (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function miniappInlineKeyboard(
  baseUrl: string,
  options: { screen?: MiniappScreen; buttonText?: string } = {},
): InlineKeyboard {
  const text = options.buttonText ?? "Открыть Mini App";
  return new InlineKeyboard().webApp(
    text,
    buildMiniappUrl(baseUrl, options.screen),
  );
}
