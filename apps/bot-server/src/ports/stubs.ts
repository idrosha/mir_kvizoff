import type { BotServerPorts } from "./types.js";

/**
 * Temporary stubs for the bot process.
 * Real economy confirmation is ProgressStore + /api/shop/confirm-receipt (no secrets).
 */
export function createStubPorts(): BotServerPorts {
  return {
    auth: {
      async verifyPlayer() {
        return null;
      },
    },
    payment: {
      async confirmReceipt(payload) {
        if (
          (payload.provider === "stub-telegram" ||
            payload.provider === "stub-web" ||
            payload.provider === "stub-play") &&
          payload.receiptId.startsWith("stub:")
        ) {
          return { ok: true };
        }
        return { ok: false, reason: "Unsupported or invalid stub receipt" };
      },
    },
    storage: {
      async getPlayerState() {
        return null;
      },
      async savePlayerState() {},
    },
    leaderboard: {
      async getTop() {
        return [];
      },
    },
    clock: {
      now: () => new Date(),
    },
    random: {
      next: () => Math.random(),
    },
  };
}
