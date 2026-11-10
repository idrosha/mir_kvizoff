import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COSMETIC_CATEGORIES,
  STARTER_ITEM_IDS,
  STARTER_MONEY_BALANCE,
  equipOwnedItem,
  getShopCatalog,
  prepareRetryForCommit,
  purchaseShopItem,
  unlockChampionshipCosmetics,
  type PlayerEconomy,
} from "./shop.js";

function baseEconomy(over: Partial<PlayerEconomy> = {}): PlayerEconomy {
  return {
    totalPoints: 100,
    moneyBalance: STARTER_MONEY_BALANCE,
    ownedItemIds: [...STARTER_ITEM_IDS],
    retryCredits: 0,
    championshipParticipated: false,
    avatar: {
      equipped: {
        shirt: "starter-shirt",
        pants: "starter-pants",
        shoes: "starter-shoes",
      },
    },
    secondAttemptCount: 0,
    ...over,
  };
}

describe("shop catalog", () => {
  it("covers all cosmetic categories plus retry", () => {
    const catalog = getShopCatalog();
    for (const category of COSMETIC_CATEGORIES) {
      assert.ok(
        catalog.some((i) => i.kind === "cosmetic" && i.category === category),
        `missing category ${category}`,
      );
    }
    assert.ok(catalog.some((i) => i.kind === "level_retry"));
    assert.ok(catalog.some((i) => i.section === "championship"));
  });
});

describe("purchaseShopItem", () => {
  it("buys cosmetics with points and money", () => {
    const withPoints = purchaseShopItem(baseEconomy(), "hat-fez", "points");
    assert.equal(withPoints.ok, true);
    if (!withPoints.ok) return;
    assert.equal(withPoints.economy.totalPoints, 75);
    assert.ok(withPoints.economy.ownedItemIds.includes("hat-fez"));

    const withMoney = purchaseShopItem(baseEconomy(), "glasses-round", "money");
    assert.equal(withMoney.ok, true);
    if (!withMoney.ok) return;
    assert.equal(withMoney.economy.moneyBalance, STARTER_MONEY_BALANCE - 4);
    assert.ok(withMoney.economy.ownedItemIds.includes("glasses-round"));
  });

  it("buys level retry credits", () => {
    const result = purchaseShopItem(baseEconomy(), "level-retry", "points");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.economy.retryCredits, 1);
    assert.equal(result.economy.totalPoints, 85);
  });

  it("rejects championship purchases and insufficient funds", () => {
    const champ = purchaseShopItem(baseEconomy(), "champ-hat-laurel", "points");
    assert.equal(champ.ok, false);

    const poor = purchaseShopItem(baseEconomy({ totalPoints: 1 }), "hat-fez", "points");
    assert.equal(poor.ok, false);
  });
});

describe("equip and retry", () => {
  it("equips owned cosmetics onto avatar slots", () => {
    const owned = purchaseShopItem(baseEconomy(), "hat-fez", "points");
    assert.equal(owned.ok, true);
    if (!owned.ok) return;
    const equipped = equipOwnedItem(owned.economy, "hat-fez");
    assert.equal(equipped.ok, true);
    if (!equipped.ok) return;
    assert.equal(equipped.economy.avatar.equipped.hat, "hat-fez");
  });

  it("consumes retry credit on second attempt and bumps counter", () => {
    const first = prepareRetryForCommit(baseEconomy({ retryCredits: 2 }), 0);
    assert.equal(first.ok, true);
    if (!first.ok) return;
    assert.equal(first.economy.retryCredits, 2);

    const second = prepareRetryForCommit(first.economy, 1);
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.economy.retryCredits, 1);
    assert.equal(second.economy.secondAttemptCount, 1);

    const blocked = prepareRetryForCommit(baseEconomy({ retryCredits: 0 }), 1);
    assert.equal(blocked.ok, false);
  });

  it("unlocks championship cosmetics only via participation helper", () => {
    const unlocked = unlockChampionshipCosmetics(baseEconomy());
    assert.equal(unlocked.championshipParticipated, true);
    assert.ok(unlocked.ownedItemIds.includes("champ-hat-laurel"));
    const equip = equipOwnedItem(unlocked, "champ-hat-laurel");
    assert.equal(equip.ok, true);
  });
});
