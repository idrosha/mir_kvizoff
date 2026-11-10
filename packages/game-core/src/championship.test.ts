import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CHAMPIONSHIP_ENTRY_PRODUCT_ID,
  assertValidStubChampionshipReceipt,
  championshipPeriodKey,
  createChampionshipConfig,
  isChampionshipOpenOn,
  prizeContributionFromEntry,
  selectChampionshipWinner,
} from "./championship.js";

describe("championship calendar + pool", () => {
  it("opens only on configured days of month (UTC)", () => {
    const config = createChampionshipConfig({ openDaysOfMonth: [1, 15] });
    assert.equal(isChampionshipOpenOn(new Date("2026-11-01T12:00:00Z"), config), true);
    assert.equal(isChampionshipOpenOn(new Date("2026-11-15T00:00:00Z"), config), true);
    assert.equal(isChampionshipOpenOn(new Date("2026-11-04T12:00:00Z"), config), false);
  });

  it("builds YYYY-MM period keys in UTC", () => {
    assert.equal(championshipPeriodKey(new Date("2026-11-04T09:00:00Z")), "2026-11");
    assert.equal(championshipPeriodKey(new Date("2026-01-31T23:00:00Z")), "2026-01");
  });

  it("computes integer prize contribution from entry fee share", () => {
    assert.equal(prizeContributionFromEntry(10, 0.7), 7);
    assert.equal(prizeContributionFromEntry(10, 1), 10);
    assert.equal(prizeContributionFromEntry(3, 0.5), 1);
  });
});

describe("championship winner + receipts", () => {
  it("picks highest score; ties break by earliest entry", () => {
    const result = selectChampionshipWinner([
      {
        playerId: "a",
        enteredAtMs: 200,
        receiptId: "stub:1",
        score: 2,
        runFinished: true,
      },
      {
        playerId: "b",
        enteredAtMs: 100,
        receiptId: "stub:2",
        score: 2,
        runFinished: true,
      },
      {
        playerId: "c",
        enteredAtMs: 50,
        receiptId: "stub:3",
        score: 1,
        runFinished: true,
      },
      {
        playerId: "d",
        enteredAtMs: 10,
        receiptId: "stub:4",
        score: 9,
        runFinished: false,
      },
    ]);
    assert.equal(result.winnerPlayerId, "b");
    assert.deepEqual(result.tiedPlayerIds, ["b", "a"]);
  });

  it("validates stub Stars / web receipts for championship-entry", () => {
    assert.doesNotThrow(() =>
      assertValidStubChampionshipReceipt({
        provider: "stub-telegram",
        receiptId: "stub:stars-1",
        productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
      }),
    );
    assert.throws(() =>
      assertValidStubChampionshipReceipt({
        provider: "real-stars",
        receiptId: "stub:x",
        productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
      }),
    );
    assert.throws(() =>
      assertValidStubChampionshipReceipt({
        provider: "stub-web",
        receiptId: "live:1",
        productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
      }),
    );
  });
});
