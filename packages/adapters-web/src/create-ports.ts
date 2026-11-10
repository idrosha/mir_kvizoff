import type { GameCorePorts } from "@mir-games/game-core";
import type {
  AuthPort,
  LifecyclePort,
  PaymentPort,
  StoragePort,
} from "@mir-games/platform-contracts";
import { createWebAnalytics } from "./analytics.js";
import { createWebAuth, type WebAuthOptions } from "./auth.js";
import { createWebClock } from "./clock.js";
import { createWebHaptics } from "./haptics.js";
import { createWebLifecycle } from "./lifecycle.js";
import { createWebPayment } from "./payment.js";
import { createWebRandom } from "./random.js";
import { createShopApiClient } from "./shop-client.js";
import { createWebStorage } from "./storage.js";

export type WebAdapterBundle = {
  gameCorePorts: GameCorePorts;
  auth: AuthPort;
  lifecycle: LifecyclePort;
  storage: StoragePort;
  /** PaymentPort is wired after playerId is known via `withPayment`. */
  createPayment: (playerId: string) => PaymentPort;
  shopApi: ReturnType<typeof createShopApiClient>;
};

export type CreateWebAdaptersOptions = {
  apiBaseUrl: string;
  analyticsDebug?: boolean;
  defaultPlayerId?: string;
  defaultDisplayName?: string;
  storagePrefix?: string;
};

/** Wire browser adapters for game-core + auth + PaymentPort/StoragePort stubs. */
export function createWebAdapters(
  options: CreateWebAdaptersOptions,
): WebAdapterBundle {
  const clock = createWebClock();
  const random = createWebRandom();
  const storage = createWebStorage(options.storagePrefix);
  const analytics = createWebAnalytics(options.analyticsDebug ?? false);
  const haptics = createWebHaptics();
  const authOptions: WebAuthOptions = {
    apiBaseUrl: options.apiBaseUrl,
    storage,
    defaultPlayerId: options.defaultPlayerId,
    defaultDisplayName: options.defaultDisplayName,
  };
  const auth = createWebAuth(authOptions);
  const lifecycle = createWebLifecycle();
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
      return createWebPayment({
        playerId,
        shopApi,
        provider: "stub-web",
      });
    },
  };
}
