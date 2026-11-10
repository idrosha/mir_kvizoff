export { createWebAdapters } from "./create-ports.js";
export type {
  CreateWebAdaptersOptions,
  WebAdapterBundle,
} from "./create-ports.js";

export { createWebAuth } from "./auth.js";
export type { WebAuthOptions } from "./auth.js";

export { createWebClock } from "./clock.js";
export { createWebRandom } from "./random.js";
export { createWebStorage } from "./storage.js";
export { createWebAnalytics } from "./analytics.js";
export { createWebHaptics } from "./haptics.js";
export { createWebLifecycle } from "./lifecycle.js";
export { createWebPayment } from "./payment.js";
export type { WebPaymentOptions } from "./payment.js";

export { createProgressApiClient } from "./progress-client.js";
export type { ProgressApiClient, ProgressSnapshot } from "./progress-client.js";

export { createShopApiClient } from "./shop-client.js";
export type { ShopApiClient } from "./shop-client.js";
export type {
  AccountSnapshotDto,
  ShopCatalogResponse,
  ShopCurrency,
  ShopItem,
} from "./shop-types.js";

export { createOnlineApiClient } from "./online-client.js";
export type {
  OnlineApiClient,
  OnlineMatchPublicDto,
  OnlineQueueResponse,
} from "./online-client.js";

export { createPartyApiClient } from "./party-client.js";
export type {
  PartyApiClient,
  PartyPlayerPublicDto,
  PartyRoomPublicDto,
  PartyRoomSummaryDto,
} from "./party-client.js";

export { createLeadersApiClient } from "./leaders-client.js";
export type { LeadersApiClient, LeaderboardEntryDto } from "./leaders-client.js";

export { createChampionshipApiClient } from "./championship-client.js";
export type {
  ChampionshipApiClient,
  ChampionshipRunDto,
  ChampionshipStatusDto,
} from "./championship-client.js";
