import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAMPIONSHIP_ENTRY_PRODUCT_ID,
  createChampionshipConfig,
} from "@mir-games/game-core";
import { createInMemoryProgressStore } from "../progress/store.js";
import { createInMemoryChampionshipStore } from "./store.js";

describe("ChampionshipStore", () => {
  it("rejects entry when UTC day is not in openDaysOfMonth", () => {
    let now = Date.parse("2026-11-04T12:00:00Z"); // day 4
    const progress = createInMemoryProgressStore(() => now);
    const champ = createInMemoryChampionshipStore({
      progress,
      nowMs: () => now,
      config: createChampionshipConfig({ openDaysOfMonth: [1, 15], entryFeeMoney: 10 }),
    });
    progress.getOrCreate("demo:a", "A");
    assert.equal(champ.getStatus("demo:a").open, false);
    assert.throws(
      () =>
        champ.enter("demo:a", {
          provider: "stub-web",
          receiptId: "stub:closed",
          productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
        }),
      /closed today/i,
    );

    now = Date.parse("2026-11-15T12:00:00Z");
    assert.equal(champ.getStatus("demo:a").open, true);
  });

  it("charges entry, grows prize pool, unlocks championship shop, pays winner", () => {
    const now = Date.parse("2026-11-15T12:00:00Z");
    let clock = now;
    const progress = createInMemoryProgressStore(() => clock);
    const champ = createInMemoryChampionshipStore({
      progress,
      nowMs: () => clock,
      config: createChampionshipConfig({
        openDaysOfMonth: [15],
        entryFeeMoney: 10,
        prizePoolShare: 0.7,
      }),
    });

    progress.getOrCreate("demo:alice", "Alice");
    progress.getOrCreate("demo:bob", "Bob");

    const afterAlice = champ.enter("demo:alice", {
      provider: "stub-web",
      receiptId: "stub:alice-entry",
      productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
    });
    assert.equal(afterAlice.prizePool, 7);
    assert.equal(afterAlice.you.entered, true);
    assert.equal(afterAlice.you.championshipParticipated, true);
    assert.equal(progress.snapshot("demo:alice").moneyBalance, 30); // 40 - 10
    assert.ok(progress.snapshot("demo:alice").ownedItemIds.includes("champ-hat-laurel"));

    // Idempotent same receipt.
    const again = champ.enter("demo:alice", {
      provider: "stub-web",
      receiptId: "stub:alice-entry",
      productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
    });
    assert.equal(again.prizePool, 7);
    assert.equal(progress.snapshot("demo:alice").moneyBalance, 30);

    champ.enter("demo:bob", {
      provider: "stub-telegram",
      receiptId: "stub:bob-stars",
      productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
    });
    assert.equal(champ.getStatus("demo:bob").prizePool, 14);

    // Alice scores 2 correct (rounds 0 + 2); Bob scores 1 (round 0 only).
    const aliceRun = champ.startRun("demo:alice");
    assert.ok(aliceRun.you.avatar);
    champ.submitAnswer("demo:alice", 0, { format: "single_choice", optionId: "b" });
    clock += 1;
    champ.submitAnswer("demo:alice", 1, { format: "multi_choice", optionIds: ["a"] }); // wrong
    clock += 1;
    champ.submitAnswer("demo:alice", 2, { format: "text", text: "da Vinci" });
    assert.equal(champ.getStatus("demo:alice").you.runFinished, true);
    assert.equal(champ.getStatus("demo:alice").you.score, 2);

    champ.startRun("demo:bob");
    champ.submitAnswer("demo:bob", 0, { format: "single_choice", optionId: "b" });
    clock += 1;
    champ.submitAnswer("demo:bob", 1, { format: "multi_choice", optionIds: ["a"] });
    clock += 1;
    champ.submitAnswer("demo:bob", 2, { format: "text", text: "nope" });
    assert.equal(champ.getStatus("demo:bob").you.score, 1);

    const settled = champ.settle("demo:alice");
    assert.equal(settled.periodStatus, "settled");
    assert.equal(settled.winnerPlayerId, "demo:alice");
    assert.equal(settled.winnerPayout, 14);
    assert.equal(settled.prizePool, 0);
    // Alice: 30 + 14 payout = 44
    assert.equal(progress.snapshot("demo:alice").moneyBalance, 44);
    assert.equal(progress.snapshot("demo:bob").moneyBalance, 30);
  });

  it("rejects non-stub receipts and unknown products", () => {
    const now = Date.parse("2026-11-15T12:00:00Z");
    const progress = createInMemoryProgressStore(() => now);
    const champ = createInMemoryChampionshipStore({
      progress,
      nowMs: () => now,
      config: createChampionshipConfig({ openDaysOfMonth: [15] }),
    });
    progress.getOrCreate("demo:x");
    assert.throws(
      () =>
        champ.enter("demo:x", {
          provider: "telegram-stars",
          receiptId: "stub:x",
          productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
        }),
      /Unsupported payment provider/,
    );
    assert.throws(
      () =>
        champ.enter("demo:x", {
          provider: "stub-web",
          receiptId: "stub:x",
          productId: "hat-fez",
        }),
      /Expected product/,
    );
  });
});
