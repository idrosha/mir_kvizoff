import type { AuthPort, PlayerIdentity } from "@mir-games/platform-contracts";
import type { TelegramWebApp } from "./telegram-webapp.js";

export type TelegramAuthOptions = {
  /** Base URL of bot-server HTTP API (no trailing slash). */
  apiBaseUrl: string;
  /** Optional override when running outside Telegram (browser demo). */
  demoPlayerId?: string;
  getWebApp?: () => TelegramWebApp | undefined;
};

function defaultGetWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.Telegram?.WebApp;
}

/**
 * AuthPort: verifies Telegram initData via bot-server.
 * Demo mode (no WebApp): posts a fake initData token accepted only by the stub server.
 */
export function createTelegramAuth(options: TelegramAuthOptions): AuthPort {
  const getWebApp = options.getWebApp ?? defaultGetWebApp;
  let session: PlayerIdentity | null = null;

  return {
    async verifyPlayer(initData: string): Promise<PlayerIdentity | null> {
      const res = await fetch(`${options.apiBaseUrl}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      if (!res.ok) {
        session = null;
        return null;
      }
      const body = (await res.json()) as { player?: PlayerIdentity | null };
      session = body.player ?? null;
      return session;
    },

    async getSession(): Promise<PlayerIdentity | null> {
      if (session) {
        return session;
      }
      const webApp = getWebApp();
      const initData =
        webApp?.initData && webApp.initData.length > 0
          ? webApp.initData
          : `demo:${options.demoPlayerId ?? "local-demo"}`;
      return this.verifyPlayer(initData);
    },

    async clearSession(): Promise<void> {
      session = null;
    },
  };
}
