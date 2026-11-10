import type {
  AnalyticsPort,
  AudioPort,
  ClockPort,
  HapticsPort,
  RandomPort,
  StoragePort,
} from "@mir-games/platform-contracts";

/**
 * Ports injected into game-core.
 * Core never touches DOM, window, Telegram, fetch, or localStorage.
 */
export type GameCorePorts = {
  clock: ClockPort;
  random: RandomPort;
  /** Optional — used for UI cache keys only, not economy source of truth. */
  storage?: StoragePort;
  analytics?: AnalyticsPort;
  audio?: AudioPort;
  haptics?: HapticsPort;
};
