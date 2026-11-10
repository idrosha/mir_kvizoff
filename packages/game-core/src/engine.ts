import {
  applyLevelResult,
  createEmptyProgress,
  isBlockUnlocked,
  isLevelUnlocked,
  sumBlockScore,
} from "./gating.js";
import type { GameCorePorts } from "./ports.js";
import { LevelSession } from "./session.js";
import type {
  AvatarLoadout,
  LevelDefinition,
  LevelRunResult,
  SinglePlayerProgress,
} from "./types.js";

export type GameCoreEngine = {
  getProgress(): SinglePlayerProgress;
  setProgress(progress: SinglePlayerProgress): void;
  getAvatar(): AvatarLoadout;
  setAvatar(loadout: AvatarLoadout): void;
  isLevelUnlocked(levelIndex: number): boolean;
  isBlockUnlocked(blockIndex: number): boolean;
  blockScore(blockIndex: number): number;
  startLevel(level: LevelDefinition): LevelSession | null;
  /** Persist a finished run into progress and return the updated snapshot. */
  commitRun(result: LevelRunResult): SinglePlayerProgress;
};

/**
 * Platform-free single-player facade. Inject ClockPort / RandomPort via DI.
 */
export function createGameCore(ports: GameCorePorts): GameCoreEngine {
  let progress = createEmptyProgress();
  let avatar: AvatarLoadout = { equipped: {} };

  return {
    getProgress() {
      return progress;
    },
    setProgress(next) {
      progress = next;
    },
    getAvatar() {
      return avatar;
    },
    setAvatar(loadout) {
      avatar = loadout;
    },
    isLevelUnlocked(levelIndex) {
      return isLevelUnlocked(progress, levelIndex);
    },
    isBlockUnlocked(blockIndex) {
      return isBlockUnlocked(progress, blockIndex);
    },
    blockScore(blockIndex) {
      return sumBlockScore(progress, blockIndex);
    },
    startLevel(level) {
      const session = LevelSession.start(ports, progress, level);
      if (session) {
        ports.analytics?.track("level_started", { levelIndex: level.levelIndex });
      }
      return session;
    },
    commitRun(result) {
      progress = applyLevelResult(progress, result.levelIndex, result.score);
      ports.analytics?.track("level_completed", {
        levelIndex: result.levelIndex,
        score: result.score,
        correctCount: result.correctCount,
      });
      return progress;
    },
  };
}
