import type { GameCorePorts } from "@mir-games/game-core";
import type {
  AuthPort,
  LifecyclePort,
  PaymentPort,
  StoragePort,
} from "@mir-games/platform-contracts";
import { createTelegramAnalytics } from "./analytics.js";
import { createTelegramAuth, type TelegramAuthOptions } from "./auth.js";
import { createTelegramClock } from "./clock.js";
import { createTelegramHaptics } from "./haptics.js";
import { createTelegramLifecycle } from "./lifecycle.js";
import { createTelegramPayment } from "./payment.js";
import { createTelegramRandom } from "./random.js";
import { createShopApiClient } from "./shop-client.js";
import { createTelegramStorage } from "./storage.js";

export type TelegramAdapterBundle = {
  gameCorePorts: GameCorePorts;
  auth: AuthPort;
  lifecycle: LifecyclePort;
  storage: StoragePort;
  createPayment: (playerId: string) => PaymentPort;
  shopApi: ReturnType<typeof createShopApiClient>;
};

export type CreateTelegramAdaptersOptions = TelegramAuthOptions & {
  analyticsDebug?: boolean;
};

/** Wire Telegram / browser adapters for game-core + PaymentPort/StoragePort. */
export function createTelegramAdapters(
  options: CreateTelegramAdaptersOptions,
): TelegramAdapterBundle {
  const clock = createTelegramClock();
  const random = createTelegramRandom();
  const storage = createTelegramStorage();
  const analytics = createTelegramAnalytics(options.analyticsDebug ?? false);
  const haptics = createTelegramHaptics();
  const auth = createTelegramAuth(options);
  const lifecycle = createTelegramLifecycle();
  const shopApi = createShopApiClient(options.apiBaseUrl);

  return {
    gameCorePorts: {
      clock,
      random,
      storage,
      analytics,
      haptics,
    },
    auth,
    lifecycle,
    storage,
    shopApi,
    createPayment(playerId: string) {
      return createTelegramPayment({
        playerId,
        shopApi,
        provider: "stub-telegram",
      });
    },
  };
}
