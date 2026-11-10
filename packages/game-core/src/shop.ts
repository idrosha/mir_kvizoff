import type { AvatarLoadout, EquipmentSlot } from "./types.js";

/** UI / catalog categories (product language). */
export type CosmeticCategory =
  | "hats"
  | "glasses"
  | "shirts"
  | "sweaters"
  | "accessories"
  | "pants"
  | "shoes";

export type ShopCurrency = "points" | "money";

export type ShopSection = "standard" | "championship";

export type ShopProductKind = "cosmetic" | "level_retry";

export type ShopItem = {
  id: string;
  kind: ShopProductKind;
  title: string;
  section: ShopSection;
  /** Present for cosmetics. */
  category?: CosmeticCategory;
  /** Points price when purchasable with points. */
  pricePoints?: number;
  /** Stub money units (no real payment secrets). */
  priceMoney?: number;
};

export type PlayerEconomy = {
  totalPoints: number;
  moneyBalance: number;
  ownedItemIds: string[];
  retryCredits: number;
  championshipParticipated: boolean;
  avatar: AvatarLoadout;
  secondAttemptCount: number;
};

export type EconomyMutationResult =
  | { ok: true; economy: PlayerEconomy }
  | { ok: false; reason: string; economy: PlayerEconomy };

export const CATEGORY_TO_SLOT: Record<CosmeticCategory, EquipmentSlot> = {
  hats: "hat",
  glasses: "glasses",
  shirts: "shirt",
  sweaters: "sweater",
  accessories: "accessory",
  pants: "pants",
  shoes: "shoes",
};

export const SLOT_TO_CATEGORY: Record<EquipmentSlot, CosmeticCategory> = {
  hat: "hats",
  glasses: "glasses",
  shirt: "shirts",
  sweater: "sweaters",
  accessory: "accessories",
  pants: "pants",
  shoes: "shoes",
};

export const COSMETIC_CATEGORIES: CosmeticCategory[] = [
  "hats",
  "glasses",
  "shirts",
  "sweaters",
  "accessories",
  "pants",
  "shoes",
];

/** Starter cosmetics granted on account create. */
export const STARTER_ITEM_IDS = [
  "starter-shirt",
  "starter-pants",
  "starter-shoes",
] as const;

/** Demo stub money so shop can be exercised without real payments. */
export const STARTER_MONEY_BALANCE = 40;

export function getShopCatalog(): ShopItem[] {
  return [
    {
      id: "starter-shirt",
      kind: "cosmetic",
      title: "Стартовая рубашка",
      category: "shirts",
      section: "standard",
      pricePoints: 0,
    },
    {
      id: "starter-pants",
      kind: "cosmetic",
      title: "Стартовые штаны",
      category: "pants",
      section: "standard",
      pricePoints: 0,
    },
    {
      id: "starter-shoes",
      kind: "cosmetic",
      title: "Стартовая обувь",
      category: "shoes",
      section: "standard",
      pricePoints: 0,
    },
    {
      id: "hat-fez",
      kind: "cosmetic",
      title: "Феска",
      category: "hats",
      section: "standard",
      pricePoints: 25,
      priceMoney: 5,
    },
    {
      id: "hat-turban",
      kind: "cosmetic",
      title: "Тюрбан",
      category: "hats",
      section: "standard",
      pricePoints: 40,
      priceMoney: 8,
    },
    {
      id: "glasses-round",
      kind: "cosmetic",
      title: "Круглые очки",
      category: "glasses",
      section: "standard",
      pricePoints: 20,
      priceMoney: 4,
    },
    {
      id: "glasses-sun",
      kind: "cosmetic",
      title: "Солнечные очки",
      category: "glasses",
      section: "standard",
      pricePoints: 30,
      priceMoney: 6,
    },
    {
      id: "shirt-linen",
      kind: "cosmetic",
      title: "Льняная рубашка",
      category: "shirts",
      section: "standard",
      pricePoints: 35,
      priceMoney: 7,
    },
    {
      id: "sweater-nile",
      kind: "cosmetic",
      title: "Кофта «Нил»",
      category: "sweaters",
      section: "standard",
      pricePoints: 45,
      priceMoney: 9,
    },
    {
      id: "accessory-amulet",
      kind: "cosmetic",
      title: "Амулет",
      category: "accessories",
      section: "standard",
      pricePoints: 22,
      priceMoney: 5,
    },
    {
      id: "pants-sand",
      kind: "cosmetic",
      title: "Песочные штаны",
      category: "pants",
      section: "standard",
      pricePoints: 28,
      priceMoney: 6,
    },
    {
      id: "shoes-desert",
      kind: "cosmetic",
      title: "Пустынные ботинки",
      category: "shoes",
      section: "standard",
      pricePoints: 26,
      priceMoney: 5,
    },
    {
      id: "level-retry",
      kind: "level_retry",
      title: "Повторная попытка уровня",
      section: "standard",
      pricePoints: 15,
      priceMoney: 3,
    },
    // Championship-only — locked until participation (Phase 7).
    {
      id: "champ-hat-laurel",
      kind: "cosmetic",
      title: "Лавровый венок чемпиона",
      category: "hats",
      section: "championship",
      pricePoints: 0,
    },
    {
      id: "champ-cape",
      kind: "cosmetic",
      title: "Плащ чемпиона",
      category: "accessories",
      section: "championship",
      pricePoints: 0,
    },
    {
      id: "champ-shoes-gold",
      kind: "cosmetic",
      title: "Золотые сандалии",
      category: "shoes",
      section: "championship",
      pricePoints: 0,
    },
  ];
}

export function findShopItem(itemId: string): ShopItem | undefined {
  return getShopCatalog().find((item) => item.id === itemId);
}

function cloneEconomy(economy: PlayerEconomy): PlayerEconomy {
  return {
    ...economy,
    ownedItemIds: [...economy.ownedItemIds],
    avatar: { equipped: { ...economy.avatar.equipped } },
  };
}

/**
 * Purchase a standard catalog item with points or stub money.
 * Championship items cannot be bought — only unlocked by participation later.
 */
export function purchaseShopItem(
  economy: PlayerEconomy,
  itemId: string,
  currency: ShopCurrency,
): EconomyMutationResult {
  const current = cloneEconomy(economy);
  const item = findShopItem(itemId);
  if (!item) {
    return { ok: false, reason: `Unknown product: ${itemId}`, economy: current };
  }

  if (item.section === "championship") {
    return {
      ok: false,
      reason: "Championship items unlock only by championship participation (Phase 7)",
      economy: current,
    };
  }

  if (item.kind === "cosmetic" && current.ownedItemIds.includes(item.id)) {
    return { ok: false, reason: "Already owned", economy: current };
  }

  const price =
    currency === "points" ? item.pricePoints : item.priceMoney;
  if (price === undefined) {
    return {
      ok: false,
      reason: `Product ${itemId} cannot be bought with ${currency}`,
      economy: current,
    };
  }

  if (currency === "points") {
    if (current.totalPoints < price) {
      return { ok: false, reason: "Not enough points", economy: current };
    }
    current.totalPoints -= price;
  } else {
    if (current.moneyBalance < price) {
      return { ok: false, reason: "Not enough money (stub)", economy: current };
    }
    current.moneyBalance -= price;
  }

  if (item.kind === "cosmetic") {
    current.ownedItemIds.push(item.id);
  } else if (item.kind === "level_retry") {
    current.retryCredits += 1;
  }

  return { ok: true, economy: current };
}

/** Equip an owned cosmetic; championship items require participation. */
export function equipOwnedItem(
  economy: PlayerEconomy,
  itemId: string,
): EconomyMutationResult {
  const current = cloneEconomy(economy);
  const item = findShopItem(itemId);
  if (!item || item.kind !== "cosmetic" || !item.category) {
    return { ok: false, reason: `Not a cosmetic: ${itemId}`, economy: current };
  }
  if (!current.ownedItemIds.includes(itemId)) {
    return { ok: false, reason: "Item not owned", economy: current };
  }
  if (item.section === "championship" && !current.championshipParticipated) {
    return {
      ok: false,
      reason: "Championship section locked until participation",
      economy: current,
    };
  }
  const slot = CATEGORY_TO_SLOT[item.category];
  current.avatar.equipped[slot] = itemId;
  return { ok: true, economy: current };
}

export function unequipSlot(
  economy: PlayerEconomy,
  slot: EquipmentSlot,
): EconomyMutationResult {
  const current = cloneEconomy(economy);
  delete current.avatar.equipped[slot];
  return { ok: true, economy: current };
}

/**
 * When committing a re-run, consume one retry credit and bump second-attempt counter.
 * First attempt (prevAttempts === 0) does not consume credits.
 */
export function prepareRetryForCommit(
  economy: PlayerEconomy,
  previousAttemptCount: number,
): EconomyMutationResult {
  const current = cloneEconomy(economy);
  if (previousAttemptCount < 1) {
    return { ok: true, economy: current };
  }
  if (current.retryCredits < 1) {
    return {
      ok: false,
      reason: "No retry credits — buy a level retry in the shop",
      economy: current,
    };
  }
  current.retryCredits -= 1;
  current.secondAttemptCount += 1;
  return { ok: true, economy: current };
}

/** Grant championship cosmetics after participation (Phase 7 hook; testable now). */
export function unlockChampionshipCosmetics(
  economy: PlayerEconomy,
): PlayerEconomy {
  const current = cloneEconomy(economy);
  current.championshipParticipated = true;
  for (const item of getShopCatalog()) {
    if (item.section === "championship" && !current.ownedItemIds.includes(item.id)) {
      current.ownedItemIds.push(item.id);
    }
  }
  return current;
}
