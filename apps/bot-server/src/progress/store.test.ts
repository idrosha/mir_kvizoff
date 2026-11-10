import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInMemoryProgressStore } from "./store.js";

describe("ProgressStore shop + account", () => {
  it("buys cosmetics / retries and reflects them on account snapshot", () => {
    const store = createInMemoryProgressStore(() => 1);
    const playerId = "demo:shopper";
    store.getOrCreate(playerId, "Shopper");
    store.buyItem(playerId, "hat-fez", "money");
    store.equipItem(playerId, "hat-fez");
    store.buyItem(playerId, "level-retry", "money");

    const snap = store.snapshot(playerId);
    assert.ok(snap.ownedItemIds.includes("hat-fez"));
    assert.equal(snap.avatar.equipped.hat, "hat-fez");
    assert.equal(snap.retryCredits, 1);
    assert.equal(snap.championshipParticipated, false);
    assert.equal(snap.settings.language, "ru");
  });

  it("consumes retry credit on second level commit and bumps secondAttemptCount", () => {
    const store = createInMemoryProgressStore(() => 1);
    const playerId = "demo:retry";
    store.getOrCreate(playerId);
    store.buyItem(playerId, "level-retry", "money");

    const result = {
      levelIndex: 1,
      totalQuestions: 30,
      correctCount: 10,
      score: 10,
      answers: [],
    };
    store.commitRun(playerId, result);
    assert.equal(store.snapshot(playerId).retryCredits, 1);

    store.commitRun(playerId, { ...result, score: 12, correctCount: 12 });
    const after = store.snapshot(playerId);
    assert.equal(after.retryCredits, 0);
    assert.equal(after.secondAttemptCount, 1);
    assert.equal(after.stats.totalAttempts, 2);
  });

  it("rejects second commit without retry credit", () => {
    const store = createInMemoryProgressStore(() => 1);
    const playerId = "demo:blocked";
    store.getOrCreate(playerId);
    const result = {
      levelIndex: 1,
      totalQuestions: 30,
      correctCount: 5,
      score: 5,
      answers: [],
    };
    store.commitRun(playerId, result);
    assert.throws(() => store.commitRun(playerId, result), /retry/i);
  });

  it("confirms stub receipts idempotently and updates profile", () => {
    const store = createInMemoryProgressStore(() => 1);
    const playerId = "demo:pay";
    store.getOrCreate(playerId);
    store.confirmStubReceipt(playerId, {
      provider: "stub-web",
      receiptId: "stub:r1",
      productId: "glasses-round",
    });
    store.confirmStubReceipt(playerId, {
      provider: "stub-web",
      receiptId: "stub:r1",
      productId: "glasses-round",
    });
    assert.ok(store.snapshot(playerId).ownedItemIds.includes("glasses-round"));

    store.updateProfile(playerId, "Новое имя");
    assert.equal(store.snapshot(playerId).displayName, "Новое имя");
  });

  it("keeps championship shop locked until participation mark", () => {
    const store = createInMemoryProgressStore(() => 1);
    const playerId = "demo:champ";
    store.getOrCreate(playerId);
    assert.throws(() => store.buyItem(playerId, "champ-hat-laurel", "points"), /Championship/);
    store.markChampionshipParticipated(playerId);
    store.equipItem(playerId, "champ-hat-laurel");
    assert.equal(store.snapshot(playerId).avatar.equipped.hat, "champ-hat-laurel");
  });
});
