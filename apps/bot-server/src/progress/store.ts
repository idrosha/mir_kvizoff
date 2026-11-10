import {
  ONLINE_RATING_START,
  applyLevelResult,
  createEmptyProgress,
  equipOwnedItem,
  isBlockUnlocked,
  isLevelUnlocked,
  prepareRetryForCommit,
  purchaseShopItem,
  unequipSlot,
  unlockChampionshipCosmetics,
  STARTER_ITEM_IDS,
  STARTER_MONEY_BALANCE,
  type AvatarLoadout,
  type EquipmentSlot,
  type LevelRunResult,
  type ShopCurrency,
  type SinglePlayerProgress,
} from "@mir-games/game-core";

export type PlayerSettings = {
  language: string;
  soundEnabled: boolean;
};

export type PlayerSave = {
  playerId: string;
  displayName?: string;
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  /** Spendable points from committed runs. */
  totalPoints: number;
  /** Stub money units — no real payment secrets. */
  moneyBalance: number;
  ownedItemIds: string[];
  retryCredits: number;
  /** How many paid/second attempts were consumed. */
  secondAttemptCount: number;
  /** Phase 7 sets this; championship shop stays locked until then. */
  championshipParticipated: boolean;
  /** Online ladder rating — server source of truth (Phase 6). */
  onlineRating: number;
  settings: PlayerSettings;
  /** Idempotency set for stub payment receipts. */
  processedReceiptIds: string[];
  updatedAtMs: number;
};

export type AccountSnapshot = {
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
  settings: PlayerSettings;
  stats: {
    levelsCompleted: number;
    totalAttempts: number;
    bestScoreSum: number;
  };
};

export type LeaderboardEntry = {
  playerId: string;
  displayName?: string;
  onlineRating: number;
  totalPoints: number;
  levelsCompleted: number;
};

export type ProgressStore = {
  getOrCreate(playerId: string, displayName?: string): PlayerSave;
  commitRun(playerId: string, result: LevelRunResult): PlayerSave;
  setAvatar(playerId: string, avatar: AvatarLoadout): PlayerSave;
  buyItem(playerId: string, itemId: string, currency: ShopCurrency): PlayerSave;
  equipItem(playerId: string, itemId: string): PlayerSave;
  unequip(playerId: string, slot: EquipmentSlot): PlayerSave;
  updateProfile(playerId: string, displayName: string): PlayerSave;
  updateSettings(playerId: string, settings: Partial<PlayerSettings>): PlayerSave;
  confirmStubReceipt(
    playerId: string,
    receipt: { provider: string; receiptId: string; productId: string },
  ): PlayerSave;
  /** Test / Phase 7 hook. */
  markChampionshipParticipated(playerId: string): PlayerSave;
  getOnlineRating(playerId: string): number;
  setOnlineRating(playerId: string, rating: number): PlayerSave;
  snapshot(playerId: string): AccountSnapshot;
  /** Online rating ladder for the Leaders screen (server source of truth). */
  listLeaderboard(limit?: number): LeaderboardEntry[];
};

const DEFAULT_AVATAR: AvatarLoadout = {
  equipped: {
    shirt: "starter-shirt",
    pants: "starter-pants",
    shoes: "starter-shoes",
  },
};

const DEFAULT_SETTINGS: PlayerSettings = {
  language: "ru",
  soundEnabled: true,
};

function computeStats(progress: SinglePlayerProgress): AccountSnapshot["stats"] {
  let levelsCompleted = 0;
  let totalAttempts = 0;
  let bestScoreSum = 0;
  for (const record of Object.values(progress.levels)) {
    if (record.completed) {
      levelsCompleted += 1;
    }
    totalAttempts += record.attemptCount;
    bestScoreSum += record.bestScore;
  }
  return { levelsCompleted, totalAttempts, bestScoreSum };
}

function toSnapshot(save: PlayerSave): AccountSnapshot {
  return {
    playerId: save.playerId,
    displayName: save.displayName,
    progress: save.progress,
    avatar: save.avatar,
    totalPoints: save.totalPoints,
    moneyBalance: save.moneyBalance,
    ownedItemIds: [...save.ownedItemIds],
    retryCredits: save.retryCredits,
    secondAttemptCount: save.secondAttemptCount,
    championshipParticipated: save.championshipParticipated,
    onlineRating: save.onlineRating,
    settings: { ...save.settings },
    stats: computeStats(save.progress),
  };
}

function economyFromSave(save: PlayerSave) {
  return {
    totalPoints: save.totalPoints,
    moneyBalance: save.moneyBalance,
    ownedItemIds: save.ownedItemIds,
    retryCredits: save.retryCredits,
    championshipParticipated: save.championshipParticipated,
    avatar: save.avatar,
    secondAttemptCount: save.secondAttemptCount,
  };
}

function applyEconomy(save: PlayerSave, economy: ReturnType<typeof economyFromSave>): void {
  save.totalPoints = economy.totalPoints;
  save.moneyBalance = economy.moneyBalance;
  save.ownedItemIds = economy.ownedItemIds;
  save.retryCredits = economy.retryCredits;
  save.championshipParticipated = economy.championshipParticipated;
  save.avatar = economy.avatar;
  save.secondAttemptCount = economy.secondAttemptCount;
}

/** In-memory server store — source of truth for progress / shop / account. */
export function createInMemoryProgressStore(nowMs: () => number = () => Date.now()): ProgressStore {
  const byPlayer = new Map<string, PlayerSave>();

  function getOrCreate(playerId: string, displayName?: string): PlayerSave {
    const existing = byPlayer.get(playerId);
    if (existing) {
      if (displayName && !existing.displayName) {
        existing.displayName = displayName;
      }
      return existing;
    }
    const created: PlayerSave = {
      playerId,
      displayName,
      progress: createEmptyProgress(),
      avatar: { equipped: { ...DEFAULT_AVATAR.equipped } },
      totalPoints: 0,
      moneyBalance: STARTER_MONEY_BALANCE,
      ownedItemIds: [...STARTER_ITEM_IDS],
      retryCredits: 0,
      secondAttemptCount: 0,
      championshipParticipated: false,
      onlineRating: ONLINE_RATING_START,
      settings: { ...DEFAULT_SETTINGS },
      processedReceiptIds: [],
      updatedAtMs: nowMs(),
    };
    byPlayer.set(playerId, created);
    return created;
  }

  return {
    getOrCreate,
    commitRun(playerId, result) {
      const save = getOrCreate(playerId);

      if (!isLevelUnlocked(save.progress, result.levelIndex)) {
        throw new Error(`Level ${result.levelIndex} is locked for player ${playerId}`);
      }

      const prevAttempts = save.progress.levels[result.levelIndex]?.attemptCount ?? 0;
      const retry = prepareRetryForCommit(economyFromSave(save), prevAttempts);
      if (!retry.ok) {
        throw new Error(retry.reason);
      }
      applyEconomy(save, retry.economy);

      save.progress = applyLevelResult(save.progress, result.levelIndex, result.score);
      save.totalPoints += result.score;
      save.updatedAtMs = nowMs();

      void isBlockUnlocked(save.progress, 0);

      return save;
    },
    setAvatar(playerId, avatar) {
      const save = getOrCreate(playerId);
      // Only allow equipping owned items via dedicated equip path; raw set keeps owned check soft.
      for (const itemId of Object.values(avatar.equipped)) {
        if (itemId && !save.ownedItemIds.includes(itemId)) {
          throw new Error(`Cannot equip unowned item: ${itemId}`);
        }
      }
      save.avatar = avatar;
      save.updatedAtMs = nowMs();
      return save;
    },
    buyItem(playerId, itemId, currency) {
      const save = getOrCreate(playerId);
      const result = purchaseShopItem(economyFromSave(save), itemId, currency);
      if (!result.ok) {
        throw new Error(result.reason);
      }
      applyEconomy(save, result.economy);
      save.updatedAtMs = nowMs();
      return save;
    },
    equipItem(playerId, itemId) {
      const save = getOrCreate(playerId);
      const result = equipOwnedItem(economyFromSave(save), itemId);
      if (!result.ok) {
        throw new Error(result.reason);
      }
      applyEconomy(save, result.economy);
      save.updatedAtMs = nowMs();
      return save;
    },
    unequip(playerId, slot) {
      const save = getOrCreate(playerId);
      const result = unequipSlot(economyFromSave(save), slot);
      if (!result.ok) {
        throw new Error(result.reason);
      }
      applyEconomy(save, result.economy);
      save.updatedAtMs = nowMs();
      return save;
    },
    updateProfile(playerId, displayName) {
      const save = getOrCreate(playerId);
      const trimmed = displayName.trim();
      if (!trimmed || trimmed.length > 40) {
        throw new Error("displayName must be 1–40 characters");
      }
      save.displayName = trimmed;
      save.updatedAtMs = nowMs();
      return save;
    },
    updateSettings(playerId, settings) {
      const save = getOrCreate(playerId);
      if (settings.language !== undefined) {
        if (!["ru", "en"].includes(settings.language)) {
          throw new Error("language must be ru or en");
        }
        save.settings.language = settings.language;
      }
      if (settings.soundEnabled !== undefined) {
        save.settings.soundEnabled = Boolean(settings.soundEnabled);
      }
      save.updatedAtMs = nowMs();
      return save;
    },
    confirmStubReceipt(playerId, receipt) {
      const save = getOrCreate(playerId);
      if (!receipt.provider || !receipt.receiptId || !receipt.productId) {
        throw new Error("provider, receiptId and productId required");
      }
      // Stub providers only — no real payment secrets, Stars keys, or Play Billing keys.
      if (
        receipt.provider !== "stub-telegram" &&
        receipt.provider !== "stub-web" &&
        receipt.provider !== "stub-play"
      ) {
        throw new Error(`Unsupported payment provider stub: ${receipt.provider}`);
      }
      if (!receipt.receiptId.startsWith("stub:")) {
        throw new Error("Stub receipts must use receiptId prefix stub:");
      }
      if (save.processedReceiptIds.includes(receipt.receiptId)) {
        // Idempotent success.
        return save;
      }
      const result = purchaseShopItem(economyFromSave(save), receipt.productId, "money");
      if (!result.ok) {
        throw new Error(result.reason);
      }
      applyEconomy(save, result.economy);
      save.processedReceiptIds.push(receipt.receiptId);
      save.updatedAtMs = nowMs();
      return save;
    },
    markChampionshipParticipated(playerId) {
      const save = getOrCreate(playerId);
      const next = unlockChampionshipCosmetics(economyFromSave(save));
      applyEconomy(save, next);
      save.updatedAtMs = nowMs();
      return save;
    },
    getOnlineRating(playerId) {
      return getOrCreate(playerId).onlineRating;
    },
    setOnlineRating(playerId, rating) {
      const save = getOrCreate(playerId);
      save.onlineRating = Math.max(0, Math.floor(rating));
      save.updatedAtMs = nowMs();
      return save;
    },
    snapshot(playerId) {
      return toSnapshot(getOrCreate(playerId));
    },
    listLeaderboard(limit = 20) {
      const capped = Math.max(1, Math.min(100, Math.floor(limit)));
      const rows: LeaderboardEntry[] = [];
      for (const save of byPlayer.values()) {
        const stats = computeStats(save.progress);
        rows.push({
          playerId: save.playerId,
          displayName: save.displayName,
          onlineRating: save.onlineRating,
          totalPoints: save.totalPoints,
          levelsCompleted: stats.levelsCompleted,
        });
      }
      rows.sort((a, b) => {
        if (b.onlineRating !== a.onlineRating) {
          return b.onlineRating - a.onlineRating;
        }
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return a.playerId.localeCompare(b.playerId);
      });
      return rows.slice(0, capped);
    },
  };
}
