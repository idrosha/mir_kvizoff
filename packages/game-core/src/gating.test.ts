import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BLOCK_SCORE_GATE,
  BLOCK_SIZE,
  applyLevelResult,
  blockIndexForLevel,
  createEmptyProgress,
  isBlockUnlocked,
  isLevelUnlocked,
  levelsInBlock,
  sumBlockScore,
} from "./index.js";
import { progressWithCompletedLevels } from "./test/fakes.js";

describe("block helpers", () => {
  it("maps level indices to blocks of 10", () => {
    assert.equal(blockIndexForLevel(1), 0);
    assert.equal(blockIndexForLevel(10), 0);
    assert.equal(blockIndexForLevel(11), 1);
    assert.equal(blockIndexForLevel(20), 1);
    assert.equal(blockIndexForLevel(21), 2);
  });

  it("returns inclusive level ranges per block", () => {
    assert.deepEqual(levelsInBlock(0), { start: 1, end: 10 });
    assert.deepEqual(levelsInBlock(1), { start: 11, end: 20 });
  });
});

describe("sequential unlock", () => {
  it("unlocks level 1 on empty progress", () => {
    const progress = createEmptyProgress();
    assert.equal(isLevelUnlocked(progress, 1), true);
    assert.equal(isLevelUnlocked(progress, 2), false);
  });

  it("unlocks the next level only after the previous is completed", () => {
    let progress = createEmptyProgress();
    progress = applyLevelResult(progress, 1, 20);
    assert.equal(isLevelUnlocked(progress, 2), true);
    assert.equal(isLevelUnlocked(progress, 3), false);
  });
});

describe("block gate ≥1000", () => {
  it("keeps the next block locked when the previous block sum is below the gate", () => {
    // 10 levels × 30 = 300 < 1000
    const progress = progressWithCompletedLevels(BLOCK_SIZE, 30);
    assert.equal(sumBlockScore(progress, 0), 300);
    assert.equal(isBlockUnlocked(progress, 0), true);
    assert.equal(isBlockUnlocked(progress, 1), false);
    assert.equal(isLevelUnlocked(progress, 10), true);
    assert.equal(isLevelUnlocked(progress, 11), false);
  });

  it("unlocks the next block when previous block is complete and sum ≥ gate", () => {
    const perLevel = Math.ceil(BLOCK_SCORE_GATE / BLOCK_SIZE); // 100
    const progress = progressWithCompletedLevels(BLOCK_SIZE, perLevel);
    assert.equal(sumBlockScore(progress, 0), perLevel * BLOCK_SIZE);
    assert.ok(sumBlockScore(progress, 0) >= BLOCK_SCORE_GATE);
    assert.equal(isBlockUnlocked(progress, 1), true);
    assert.equal(isLevelUnlocked(progress, 11), true);
    assert.equal(isLevelUnlocked(progress, 12), false);
  });

  it("still requires sequential completion inside an unlocked block", () => {
    const progress = progressWithCompletedLevels(BLOCK_SIZE, 100);
    assert.equal(isLevelUnlocked(progress, 11), true);
    // Level 12 still needs level 11 completed
    assert.equal(isLevelUnlocked(progress, 12), false);
  });

  it("does not unlock the next block if the last level of the block is done but sum is low", () => {
    // Complete 1–9 with high scores, level 10 with low — sum still under gate
    let progress = progressWithCompletedLevels(9, 100);
    progress = applyLevelResult(progress, 10, 10); // sum = 910 < 1000
    assert.equal(sumBlockScore(progress, 0), 910);
    assert.equal(isLevelUnlocked(progress, 10), true);
    assert.equal(isBlockUnlocked(progress, 1), false);
    assert.equal(isLevelUnlocked(progress, 11), false);
  });

  it("uses lastScore for the block sum (retry can change the gate outcome)", () => {
    let progress = progressWithCompletedLevels(BLOCK_SIZE, 100);
    assert.equal(isLevelUnlocked(progress, 11), true);
    // Retry level 10 with a worse score that drops the block under the gate
    progress = applyLevelResult(progress, 10, 0);
    assert.equal(sumBlockScore(progress, 0), 900);
    assert.equal(isBlockUnlocked(progress, 1), false);
    assert.equal(isLevelUnlocked(progress, 11), false);
  });
});
