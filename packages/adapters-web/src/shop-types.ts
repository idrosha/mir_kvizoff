import type {
  AvatarLoadout,
  ShopCurrency,
  ShopItem,
  SinglePlayerProgress,
} from "@mir-games/game-core";

export type { ShopCurrency, ShopItem };

export type AccountSnapshotDto = {
  playerId: string;
  displayName?: string;
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  totalPoints: number;
  moneyBalance: number;
  ownedItemIds: string[];
  retryCredits: number;
  secondAttemptCount: number;
  championshipParticipated: boolean;
  onlineRating: number;
  settings: {
    language: string;
    soundEnabled: boolean;
  };
  stats: {
    levelsCompleted: number;
    totalAttempts: number;
    bestScoreSum: number;
  };
};

export type ShopCatalogResponse = {
  categories: string[];
  items: ShopItem[];
  championshipUnlocked: boolean;
};
