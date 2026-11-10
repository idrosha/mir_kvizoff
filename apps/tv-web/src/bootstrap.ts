import {
  createChampionshipApiClient,
  createOnlineApiClient,
  createProgressApiClient,
  createTvAdapters,
  tvSafeZoneCssVars,
  type ChampionshipApiClient,
  type OnlineApiClient,
  type ProgressApiClient,
  type ShopApiClient,
  type TvCapabilityProfile,
} from "@mir-games/adapters-tv";
import { createGameCore, type GameCoreEngine } from "@mir-games/game-core";
import type {
  AuthPort,
  InputPort,
  PaymentPort,
  PlayerIdentity,
  StoragePort,
} from "@mir-games/platform-contracts";

/** Same shape as web AppBootstrap + TV capability / input. */
export type AppBootstrap = {
  apiBaseUrl: string;
  engine: GameCoreEngine;
  auth: AuthPort;
  payment: PaymentPort;
  storage: StoragePort;
  progressApi: ProgressApiClient;
  shopApi: ShopApiClient;
  onlineApi: OnlineApiClient;
  championshipApi: ChampionshipApiClient;
  player: PlayerIdentity;
  capability: TvCapabilityProfile;
  input: InputPort;
};

function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.replace(/\/$/, "");
  }
  return "http://127.0.0.1:8787";
}

function applySafeZoneCss(capability: TvCapabilityProfile): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  const vars = tvSafeZoneCssVars(capability);
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.dataset.platform = capability.platform;
}

export async function bootstrapApp(): Promise<AppBootstrap> {
  const apiBaseUrl = resolveApiBaseUrl();
  const adapters = createTvAdapters({
    apiBaseUrl,
    defaultPlayerId: "tv-demo",
    defaultDisplayName: "TV player",
    analyticsDebug: Boolean(import.meta.env.DEV),
  });

  applySafeZoneCss(adapters.capability);

  const player = await adapters.auth.getSession();
  if (!player) {
    throw new Error("Не удалось авторизоваться (demo TV auth)");
  }

  const progressApi = createProgressApiClient(apiBaseUrl);
  const onlineApi = createOnlineApiClient(apiBaseUrl);
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

  return {
    apiBaseUrl,
    engine,
    auth: adapters.auth,
    payment,
    storage: adapters.storage,
    progressApi,
    shopApi: adapters.shopApi,
    onlineApi,
    championshipApi,
    player,
    capability: adapters.capability,
    input: adapters.input,
  };
}
