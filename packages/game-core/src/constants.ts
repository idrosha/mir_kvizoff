/** Single-player level length (Phase 2). */
export const QUESTIONS_PER_LEVEL = 30;

/** Answer window in milliseconds — ClockPort is the only time source. */
export const ANSWER_TIME_MS = 10_000;

/** Levels are gated in blocks of this size. */
export const BLOCK_SIZE = 10;

/**
 * Minimum sum of level scores in a completed block required to open the next block.
 * Product rule (approved 2026-11-04). Bonus formula may raise scores later (§9).
 */
export const BLOCK_SCORE_GATE = 1000;

/** Points awarded per fully correct answer in a run (MVP: count of correct). */
export const POINTS_PER_CORRECT = 1;
