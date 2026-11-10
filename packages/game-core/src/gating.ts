import { BLOCK_SCORE_GATE, BLOCK_SIZE } from "./constants.js";
import type { LevelRecord, SinglePlayerProgress } from "./types.js";

/** 0-based block index for a 1-based levelIndex (levels 1–10 → 0, 11–20 → 1, …). */
export function blockIndexForLevel(levelIndex: number): number {
  if (levelIndex < 1) {
    throw new Error(`levelIndex must be >= 1, got ${levelIndex}`);
  }
  return Math.floor((levelIndex - 1) / BLOCK_SIZE);
}

/** Inclusive 1-based range of levels in a block. */
export function levelsInBlock(blockIndex: number): { start: number; end: number } {
  if (blockIndex < 0) {
    throw new Error(`blockIndex must be >= 0, got ${blockIndex}`);
  }
  const start = blockIndex * BLOCK_SIZE + 1;
  return { start, end: start + BLOCK_SIZE - 1 };
}

export function getLevelRecord(
  progress: SinglePlayerProgress,
  levelIndex: number,
): LevelRecord | undefined {
  return progress.levels[levelIndex];
}

/**
 * Sum of lastScore for all levels in the block.
 * Uses last finished run score per level (product gate is over the completed block).
 */
export function sumBlockScore(progress: SinglePlayerProgress, blockIndex: number): number {
  const { start, end } = levelsInBlock(blockIndex);
  let sum = 0;
  for (let i = start; i <= end; i += 1) {
    const record = progress.levels[i];
    if (record?.completed) {
      sum += record.lastScore;
    }
  }
  return sum;
}

/** Whether every level in the block has been completed at least once. */
export function isBlockCompleted(progress: SinglePlayerProgress, blockIndex: number): boolean {
  const { start, end } = levelsInBlock(blockIndex);
  for (let i = start; i <= end; i += 1) {
    if (!progress.levels[i]?.completed) {
      return false;
    }
  }
  return true;
}

/**
 * Next-block gate: previous block must be completed AND sum(lastScore) >= BLOCK_SCORE_GATE.
 * Block 0 has no previous-block gate.
 */
export function isBlockUnlocked(progress: SinglePlayerProgress, blockIndex: number): boolean {
  if (blockIndex <= 0) {
    return true;
  }
  const previous = blockIndex - 1;
  if (!isBlockCompleted(progress, previous)) {
    return false;
  }
  return sumBlockScore(progress, previous) >= BLOCK_SCORE_GATE;
}

/**
 * Sequential unlock + block gate.
 * Level N (N > 1) requires level N-1 completed; entering a new block also requires the gate.
 */
export function isLevelUnlocked(progress: SinglePlayerProgress, levelIndex: number): boolean {
  if (levelIndex < 1) {
    return false;
  }
  if (!isBlockUnlocked(progress, blockIndexForLevel(levelIndex))) {
    return false;
  }
  if (levelIndex === 1) {
    return true;
  }
  return progress.levels[levelIndex - 1]?.completed === true;
}

export function createEmptyProgress(): SinglePlayerProgress {
  return { levels: {} };
}

/** Apply a finished run into progress (bestScore / lastScore / attemptCount). */
export function applyLevelResult(
  progress: SinglePlayerProgress,
  levelIndex: number,
  score: number,
): SinglePlayerProgress {
  const prev = progress.levels[levelIndex];
  const next: LevelRecord = {
    levelIndex,
    completed: true,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    lastScore: score,
    attemptCount: (prev?.attemptCount ?? 0) + 1,
  };
  return {
    levels: {
      ...progress.levels,
      [levelIndex]: next,
    },
  };
}
