import {
  createWebAdapters,
  type CreateWebAdaptersOptions,
  type WebAdapterBundle,
} from "@mir-games/adapters-web";
import type { PaymentPort } from "@mir-games/platform-contracts";
import {
  MOBILE_CAPABILITY_PROFILE,
  type MobileCapabilityProfile,
} from "./capability.js";
import { createMobileHaptics } from "./haptics.js";
import { createMobilePayment } from "./payment.js";

export type MobileAdapterBundle = WebAdapterBundle & {
  capability: MobileCapabilityProfile;
};

export type CreateMobileAdaptersOptions = CreateWebAdaptersOptions;

/**
 * Thin mobile adapter layer on top of web adapters.
 * Overrides HapticsPort + PaymentPort (Play Billing stub); does not fork game-core.
 */
export function createMobileAdapters(
  options: CreateMobileAdaptersOptions,
): MobileAdapterBundle {
  const base = createWebAdapters({
    ...options,
    defaultPlayerId: options.defaultPlayerId ?? "mobile-demo",
    defaultDisplayName: options.defaultDisplayName ?? "Android player",
    storagePrefix: options.storagePrefix ?? "mir-quizov-mobile:",
  });
  const haptics = createMobileHaptics();

  return {
    ...base,
    capability: MOBILE_CAPABILITY_PROFILE,
    gameCorePorts: {
      ...base.gameCorePorts,
      haptics,
    },
    createPayment(playerId: string): PaymentPort {
      return createMobilePayment({
        playerId,
        shopApi: base.shopApi,
        provider: "stub-play",
      });
    },
  };
}
