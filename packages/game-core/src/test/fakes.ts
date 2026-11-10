import type { ClockPort, RandomPort } from "@mir-games/platform-contracts";
import type { GameCorePorts } from "../ports.js";
import type {
  ChoiceOption,
  LevelDefinition,
  Question,
  SingleChoiceQuestion,
  SinglePlayerProgress,
} from "../types.js";
import { QUESTIONS_PER_LEVEL } from "../constants.js";
import { applyLevelResult, createEmptyProgress } from "../gating.js";

export function createFakeClock(startMs = 0): ClockPort & { advance(ms: number): void; set(ms: number): void } {
  let now = startMs;
  return {
    nowMs: () => now,
    advance(ms: number) {
      now += ms;
    },
    set(ms: number) {
      now = ms;
    },
  };
}

export function createFakeRandom(sequence: number[] = [0.5]): RandomPort {
  let i = 0;
  return {
    next() {
      const value = sequence[i % sequence.length] ?? 0.5;
      i += 1;
      return value;
    },
    nextInt(minInclusive: number, maxInclusive: number) {
      const t = this.next();
      return minInclusive + Math.floor(t * (maxInclusive - minInclusive + 1));
    },
  };
}

export function createTestPorts(
  clock: ClockPort = createFakeClock(),
  random: RandomPort = createFakeRandom(),
): GameCorePorts {
  return { clock, random };
}

function fourOptions(): [ChoiceOption, ChoiceOption, ChoiceOption, ChoiceOption] {
  return [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
    { id: "d", label: "D" },
  ];
}

export function makeSingleChoice(
  id: string,
  correctOptionId: "a" | "b" | "c" | "d" = "a",
): SingleChoiceQuestion {
  return {
    id,
    format: "single_choice",
    locationTheme: "egypt",
    domain: "history",
    difficulty: "easy",
    prompt: `Q ${id}`,
    options: fourOptions(),
    correctOptionId,
  };
}

export function makeLevel(levelIndex: number, correctOptionId: "a" | "b" | "c" | "d" = "a"): LevelDefinition {
  const questions: Question[] = Array.from({ length: QUESTIONS_PER_LEVEL }, (_, i) =>
    makeSingleChoice(`L${levelIndex}-Q${i + 1}`, correctOptionId),
  );
  return {
    levelIndex,
    locationTheme: "egypt",
    questions,
  };
}

/** Build progress where levels 1..count are completed with the given lastScore each. */
export function progressWithCompletedLevels(
  count: number,
  lastScore: number,
): SinglePlayerProgress {
  let progress = createEmptyProgress();
  for (let i = 1; i <= count; i += 1) {
    progress = applyLevelResult(progress, i, lastScore);
  }
  return progress;
}
