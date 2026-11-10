import {
  createChampionshipApiClient,
  createLeadersApiClient,
  createOnlineApiClient,
  createPartyApiClient,
  createProgressApiClient,
  createWebAdapters,
  type ChampionshipApiClient,
  type LeadersApiClient,
  type OnlineApiClient,
  type PartyApiClient,
  type ProgressApiClient,
  type ShopApiClient,
} from "@mir-games/adapters-web";
import { createGameCore, type GameCoreEngine } from "@mir-games/game-core";
import type {
  AuthPort,
  PaymentPort,
  PlayerIdentity,
  StoragePort,
} from "@mir-games/platform-contracts";

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
};

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8787";
}

export async function bootstrapApp(): Promise<AppBootstrap> {
  const apiBaseUrl = resolveApiBaseUrl();
  const adapters = createWebAdapters({
    apiBaseUrl,
    defaultPlayerId: "web-demo",
    defaultDisplayName: "Web player",
    analyticsDebug: Boolean(import.meta.env.DEV),
  });

  const player = await adapters.auth.getSession();
  if (!player) {
    throw new Error("Не удалось авторизоваться (demo web auth)");
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

  // Cache settings locally via StoragePort (UI only).
  await adapters.storage.set("settings-cache", snapshot.settings);

  adapters.gameCorePorts.analytics?.identify(player.playerId, {
    displayName: player.displayName ?? null,
    platform: "web",
  });

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
  };
}
