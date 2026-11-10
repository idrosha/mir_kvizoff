export { createMobileAdapters } from "./create-ports.js";
export type {
  CreateMobileAdaptersOptions,
  MobileAdapterBundle,
} from "./create-ports.js";

export { createMobileHaptics } from "./haptics.js";
export { createMobilePayment } from "./payment.js";
export type { MobilePaymentOptions } from "./payment.js";

export {
  MOBILE_CAPABILITY_PROFILE,
} from "./capability.js";
export type { MobileCapabilityProfile } from "./capability.js";

// Re-export API clients from adapters-web so the Capacitor shell stays thin.
export {
  createProgressApiClient,
  createShopApiClient,
  createOnlineApiClient,
  createPartyApiClient,
  createLeadersApiClient,
  createChampionshipApiClient,
} from "@mir-games/adapters-web";
export type {
  ProgressApiClient,
  ProgressSnapshot,
  ShopApiClient,
  OnlineApiClient,
  OnlineMatchPublicDto,
  OnlineQueueResponse,
  PartyApiClient,
  PartyRoomPublicDto,
  PartyRoomSummaryDto,
  LeadersApiClient,
  LeaderboardEntryDto,
  ChampionshipApiClient,
  ChampionshipRunDto,
  ChampionshipStatusDto,
  AccountSnapshotDto,
  ShopCatalogResponse,
  ShopCurrency,
  ShopItem,
} from "@mir-games/adapters-web";
