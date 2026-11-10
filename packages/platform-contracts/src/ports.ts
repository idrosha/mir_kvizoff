/**
 * Platform ports — TypeScript interfaces only.
 * Adapters live outside game-core; core never imports DOM, window, Telegram, fetch, or localStorage.
 */

/** Identity / session. */
export type PlayerIdentity = {
  playerId: string;
  displayName?: string;
};

export interface AuthPort {
  verifyPlayer(initData: string): Promise<PlayerIdentity | null>;
  getSession(): Promise<PlayerIdentity | null>;
  clearSession(): Promise<void>;
}

/** Purchases and receipt confirmation (server is source of truth). */
export type PaymentReceipt = {
  provider: string;
  receiptId: string;
  productId: string;
  payload?: unknown;
};

export type PaymentResult = {
  ok: boolean;
  reason?: string;
};

export interface PaymentPort {
  purchase(productId: string, payload?: unknown): Promise<PaymentResult>;
  confirmReceipt(receipt: PaymentReceipt): Promise<PaymentResult>;
}

/**
 * Local UI cache only — not the source of truth for progress / economy.
 * Server-backed saves go through bot-server APIs, not this port alone.
 */
export interface StoragePort {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

/** Product analytics events. */
export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export interface AnalyticsPort {
  track(event: string, props?: AnalyticsProps): void;
  identify(playerId: string, traits?: AnalyticsProps): void;
}

/** Input abstraction (touch / keyboard / TV remote). */
export type InputKind = "tap" | "key" | "dpad" | "back";

export type InputEvent = {
  kind: InputKind;
  code?: string;
  x?: number;
  y?: number;
  atMs: number;
};

export interface InputPort {
  subscribe(handler: (event: InputEvent) => void): () => void;
}

/** Device vibration / haptic feedback. */
export type HapticStyle = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export interface HapticsPort {
  impact(style?: HapticStyle): void;
}

/** Native / platform share sheet. */
export type SharePayload = {
  title?: string;
  text?: string;
  url?: string;
};

export interface SharePort {
  share(payload: SharePayload): Promise<boolean>;
}

/** Ads (stub-friendly for MVP). */
export interface AdsPort {
  isReady(placementId: string): Promise<boolean>;
  show(placementId: string): Promise<{ shown: boolean }>;
}

/** App focus / pause / resume. */
export type LifecycleEvent = "focus" | "blur" | "pause" | "resume" | "hide" | "show";

export type LifecycleHandler = (event: LifecycleEvent) => void;

export interface LifecyclePort {
  subscribe(handler: LifecycleHandler): () => void;
}

/** Time source — use this instead of Date.now() in core for testability. */
export interface ClockPort {
  /** Epoch milliseconds. */
  nowMs(): number;
}

/** RNG — seedable on server where needed. */
export interface RandomPort {
  /** Float in [0, 1). */
  next(): number;
  /** Inclusive integer range. */
  nextInt(minInclusive: number, maxInclusive: number): number;
}

/** Sound / SFX / BGM. */
export type AudioChannel = "sfx" | "bgm" | "ui";

export interface AudioPort {
  play(soundId: string, channel?: AudioChannel): void;
  stop(channel?: AudioChannel): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
}

/** Leaderboards — data from server only. */
export type LeaderboardEntry = {
  playerId: string;
  displayName?: string;
  score: number;
  rank?: number;
};

export interface LeaderboardPort {
  getTop(boardId: string, limit: number): Promise<LeaderboardEntry[]>;
  submitScore(boardId: string, score: number): Promise<void>;
}

/** Push / bot notifications (delivery is platform-specific). */
export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export interface NotificationsPort {
  requestPermission(): Promise<boolean>;
  schedule(payload: NotificationPayload, atMs?: number): Promise<string | null>;
  cancel(notificationId: string): Promise<void>;
}
