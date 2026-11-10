export { createTvAdapters } from "./create-ports.js";
export type { CreateTvAdaptersOptions, TvAdapterBundle } from "./create-ports.js";

export { createTvInput, moveTvFocus } from "./input.js";
export {
  TV_CAPABILITY_PROFILE,
  tvSafeZoneCssVars,
} from "./capability.js";
export type { TvCapabilityProfile } from "./capability.js";

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
