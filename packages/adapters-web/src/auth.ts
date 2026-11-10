import type { AuthPort, PlayerIdentity, StoragePort } from "@mir-games/platform-contracts";

const PLAYER_KEY = "auth.playerId";
const NAME_KEY = "auth.displayName";

export type WebAuthOptions = {
  /** Base URL of bot-server HTTP API (no trailing slash). */
  apiBaseUrl: string;
  /** Local UI storage used to persist a stable demo identity. */
  storage: StoragePort;
  /**
   * Default local player id when none is stored yet.
   * Posted to bot-server as `demo:<id>` (same stub as Mini App outside Telegram).
   */
  defaultPlayerId?: string;
  /** Default display name for first-run demo auth. */
  defaultDisplayName?: string;
};

/**
 * Web AuthPort (Phase 4 stub).
 *
 * Product §9 still open on Telegram Login Widget vs separate account vs magic-link.
 * Until that lands, browser uses a local stable id + the existing `demo:` auth API
 * on bot-server. No secrets in the client.
 */
export function createWebAuth(options: WebAuthOptions): AuthPort {
  let session: PlayerIdentity | null = null;

  async function resolveLocalIdentity(): Promise<{ id: string; displayName: string }> {
    const storedId = await options.storage.get<string>(PLAYER_KEY);
    const storedName = await options.storage.get<string>(NAME_KEY);
    const id =
      (typeof storedId === "string" && storedId.trim()) ||
      options.defaultPlayerId ||
      "web-demo";
    const displayName =
      (typeof storedName === "string" && storedName.trim()) ||
      options.defaultDisplayName ||
      "Web player";
    if (!storedId) {
      await options.storage.set(PLAYER_KEY, id);
    }
    if (!storedName) {
      await options.storage.set(NAME_KEY, displayName);
    }
    return { id, displayName };
  }

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
      const local = await resolveLocalIdentity();
      // Same demo token shape the stub server already accepts for browser Mini App.
      const verified = await this.verifyPlayer(`demo:${local.id}`);
      if (!verified) {
        return null;
      }
      // Prefer the locally chosen label until real web-auth (§9) lands.
      session = {
        playerId: verified.playerId,
        displayName: local.displayName || verified.displayName,
      };
      return session;
    },

    async clearSession(): Promise<void> {
      session = null;
      await options.storage.remove(PLAYER_KEY);
      await options.storage.remove(NAME_KEY);
    },
  };
}
