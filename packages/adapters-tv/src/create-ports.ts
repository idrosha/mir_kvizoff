import {
  createWebAdapters,
  type CreateWebAdaptersOptions,
  type WebAdapterBundle,
} from "@mir-games/adapters-web";
import type { InputPort, PaymentPort } from "@mir-games/platform-contracts";
import {
  TV_CAPABILITY_PROFILE,
  type TvCapabilityProfile,
} from "./capability.js";
import { createTvInput } from "./input.js";

export type TvAdapterBundle = WebAdapterBundle & {
  capability: TvCapabilityProfile;
  input: InputPort;
};

export type CreateTvAdaptersOptions = CreateWebAdaptersOptions;

/**
 * Thin TV adapter layer on top of web adapters.
 * Adds InputPort (dpad/gamepad stubs) + TV capability profile; does not fork game-core.
 */
export function createTvAdapters(options: CreateTvAdaptersOptions): TvAdapterBundle {
  const base = createWebAdapters({
    ...options,
    defaultPlayerId: options.defaultPlayerId ?? "tv-demo",
    defaultDisplayName: options.defaultDisplayName ?? "TV player",
    storagePrefix: options.storagePrefix ?? "mir-quizov-tv:",
  });

  return {
    ...base,
    capability: TV_CAPABILITY_PROFILE,
    input: createTvInput(),
    createPayment(playerId: string): PaymentPort {
      return base.createPayment(playerId);
    },
  };
}
