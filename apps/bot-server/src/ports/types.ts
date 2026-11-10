/**
 * Server-side port shapes used by the bot process.
 * Client-facing contracts live in @mir-games/platform-contracts;
 * economy confirmation always runs through bot-server HTTP / these stubs.
 */

export type AuthPort = {
  /** Verify Telegram initData / identity for a player session. */
  verifyPlayer(initData: string): Promise<{ playerId: string } | null>;
};

/** Receipt confirmation — no real payment secrets; stub providers only. */
export type PaymentPort = {
  confirmReceipt(payload: {
    provider: string;
    receiptId: string;
    productId: string;
    payload?: unknown;
  }): Promise<{ ok: boolean; reason?: string }>;
};

export type StoragePort = {
  getPlayerState(playerId: string): Promise<unknown | null>;
  savePlayerState(playerId: string, state: unknown): Promise<void>;
};

export type LeaderboardPort = {
  getTop(limit: number): Promise<Array<{ playerId: string; score: number }>>;
};

export type ClockPort = {
  now(): Date;
};

export type RandomPort = {
  next(): number;
};

/** Placeholder registry — HTTP API uses ProgressStore for economy truth. */
export type BotServerPorts = {
  auth: AuthPort;
  payment: PaymentPort;
  storage: StoragePort;
  leaderboard: LeaderboardPort;
  clock: ClockPort;
  random: RandomPort;
};
