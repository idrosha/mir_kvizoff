import {
  createChampionshipApiClient,
  createOnlineApiClient,
  createProgressApiClient,
  createTelegramAdapters,
  type ChampionshipApiClient,
  type OnlineApiClient,
  type ProgressApiClient,
  type ShopApiClient,
} from "@mir-games/adapters-telegram";
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
  const adapters = createTelegramAdapters({
    apiBaseUrl,
    demoPlayerId: "local-demo",
    analyticsDebug: Boolean(import.meta.env.DEV),
  });

  const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
  webApp?.ready();
  webApp?.expand();

  const player = await adapters.auth.getSession();
  if (!player) {
    throw new Error("Не удалось авторизоваться (initData / demo)");
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
  };
}
