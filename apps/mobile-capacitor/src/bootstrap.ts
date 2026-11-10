import {
  createChampionshipApiClient,
  createLeadersApiClient,
  createMobileAdapters,
  createOnlineApiClient,
  createPartyApiClient,
  createProgressApiClient,
  type ChampionshipApiClient,
  type LeadersApiClient,
  type MobileCapabilityProfile,
  type OnlineApiClient,
  type PartyApiClient,
  type ProgressApiClient,
  type ShopApiClient,
} from "@mir-games/adapters-mobile";
import { createGameCore, type GameCoreEngine } from "@mir-games/game-core";
import type {
  AuthPort,
  PaymentPort,
  PlayerIdentity,
  StoragePort,
} from "@mir-games/platform-contracts";

/** Same shape as web AppBootstrap — thin shell reuses web UI without forking game-core. */
export type AppBootstrap = {
  apiBaseUrl: string;
  engine: GameCoreEngine;
  auth: AuthPort;
  payment: PaymentPort;
  storage: StoragePort;
  progressApi: ProgressApiClient;
  shopApi: ShopApiClient;
  onlineApi: OnlineApiClient;
  partyApi: PartyApiClient;
  leadersApi: LeadersApiClient;
  championshipApi: ChampionshipApiClient;
  player: PlayerIdentity;
  capability: MobileCapabilityProfile;
};

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  // Emulator → host loopback. Physical device: set VITE_API_BASE_URL to LAN IP.
  return "http://10.0.2.2:8787";
}

export async function bootstrapApp(): Promise<AppBootstrap> {
  const apiBaseUrl = resolveApiBaseUrl();
  const adapters = createMobileAdapters({
    apiBaseUrl,
    defaultPlayerId: "mobile-demo",
    defaultDisplayName: "Android player",
    analyticsDebug: Boolean(import.meta.env.DEV),
  });

  const player = await adapters.auth.getSession();
  if (!player) {
    throw new Error("Не удалось авторизоваться (demo mobile auth)");
  }

  const progressApi = createProgressApiClient(apiBaseUrl);
  const onlineApi = createOnlineApiClient(apiBaseUrl);
  const partyApi = createPartyApiClient(apiBaseUrl);
  const leadersApi = createLeadersApiClient(apiBaseUrl);
  const championshipApi = createChampionshipApiClient(apiBaseUrl);
  const snapshot = await progressApi.load(player.playerId);
  const payment = adapters.createPayment(player.playerId);

  const engine = createGameCore(adapters.gameCorePorts);
  engine.setProgress(snapshot.progress);
  engine.setAvatar(snapshot.avatar);

  await adapters.storage.set("settings-cache", snapshot.settings);

  adapters.gameCorePorts.analytics?.identify(player.playerId, {
    displayName: player.displayName ?? null,
    platform: adapters.capability.platform,
  });

  // Smoke haptic on boot (no-op in browser without Vibration API).
  adapters.gameCorePorts.haptics?.impact("light");

  return {
    apiBaseUrl,
    engine,
    auth: adapters.auth,
    payment,
    storage: adapters.storage,
    progressApi,
    shopApi: adapters.shopApi,
    onlineApi,
    partyApi,
    leadersApi,
    championshipApi,
    player,
    capability: adapters.capability,
  };
}
