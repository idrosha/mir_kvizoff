import { ANSWER_TIME_MS, POINTS_PER_CORRECT } from "./constants.js";
import { countCorrect, gradeAnswer, sumScore } from "./scoring.js";
import type {
  AvatarLoadout,
  GradedAnswer,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  SingleChoiceQuestion,
  TextQuestion,
} from "./types.js";

/** Fixed match length for Phase 6 MVP: one round per format. */
export const ONLINE_ROUNDS_PER_MATCH = 3;

/** Starting rating for a new online player. */
export const ONLINE_RATING_START = 1000;

/** Rating change scale: (yourScore − opponentScore) × this. */
export const ONLINE_RATING_PER_SCORE_DIFF = 10;

export type OnlineRoundKind = "single_choice" | "multi_choice" | "text";

/** Question payload safe to send to clients (no correct keys / accepted answers). */
export type PublicSingleChoiceQuestion = Omit<SingleChoiceQuestion, "correctOptionId">;
export type PublicMultiChoiceQuestion = Omit<MultiChoiceQuestion, "correctOptionIds">;
export type PublicTextQuestion = Omit<TextQuestion, "acceptedAnswers">;
export type PublicQuestion =
  | PublicSingleChoiceQuestion
  | PublicMultiChoiceQuestion
  | PublicTextQuestion;

export type OnlineRoundDefinition = {
  kind: OnlineRoundKind;
  /** Distinct thematic label for the round (plan: three themed round types). */
  theme: string;
  question: Question;
};

export type OnlineMatchDefinition = {
  rounds: OnlineRoundDefinition[];
};

export type OnlineMatchPlayerSnapshot = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  rating: number;
  score: number;
  answers: GradedAnswer[];
  /** True when this seat is the Phase 6 matchmaking stub opponent. */
  isStubOpponent?: boolean;
};

export type OnlineMatchStatus = "queued" | "active" | "finished";

/**
 * Strip answer keys before sending a question to any client.
 * Server keeps the full `Question` as source of truth for grading.
 */
export function toPublicQuestion(question: Question): PublicQuestion {
  switch (question.format) {
    case "single_choice": {
      const { correctOptionId: _correct, ...rest } = question;
      return rest;
    }
    case "multi_choice": {
      const { correctOptionIds: _correct, ...rest } = question;
      return rest;
    }
    case "text": {
      const { acceptedAnswers: _accepted, ...rest } = question;
      return rest;
    }
  }
}

export function assertOnlineMatchDefinition(def: OnlineMatchDefinition): void {
  if (def.rounds.length !== ONLINE_ROUNDS_PER_MATCH) {
    throw new Error(
      `Online match must have exactly ${ONLINE_ROUNDS_PER_MATCH} rounds, got ${def.rounds.length}`,
    );
  }
  const kinds = def.rounds.map((r) => r.kind);
  const expected: OnlineRoundKind[] = ["single_choice", "multi_choice", "text"];
  for (let i = 0; i < expected.length; i += 1) {
    if (kinds[i] !== expected[i]) {
      throw new Error(
        `Online round ${i} must be ${expected[i]} (got ${kinds[i] ?? "missing"})`,
      );
    }
    if (def.rounds[i]!.question.format !== expected[i]) {
      throw new Error(`Online round ${i} question format mismatch`);
    }
  }
  const themes = new Set(def.rounds.map((r) => r.theme));
  if (themes.size !== ONLINE_ROUNDS_PER_MATCH) {
    throw new Error("Online rounds must use three distinct themes");
  }
}

/** Grade a submitted answer against the server-held question + deadline. */
export function gradeOnlineAnswer(options: {
  question: Question;
  answer: PlayerAnswer | null;
  nowMs: number;
  deadlineMs: number;
}): GradedAnswer {
  const timedOut = options.nowMs > options.deadlineMs;
  return gradeAnswer(options.question, timedOut ? null : options.answer, timedOut);
}

export function scoreFromGraded(answers: GradedAnswer[]): {
  score: number;
  correctCount: number;
} {
  return {
    score: sumScore(answers),
    correctCount: countCorrect(answers),
  };
}

/**
 * MVP rating: delta proportional to score difference.
 * Server applies this after a finished match — clients never set rating.
 */
export function computeOnlineRatingDelta(yourScore: number, opponentScore: number): number {
  return (yourScore - opponentScore) * ONLINE_RATING_PER_SCORE_DIFF;
}

export function applyOnlineRating(currentRating: number, delta: number): number {
  return Math.max(0, currentRating + delta);
}

export function nextRoundDeadlineMs(nowMs: number): number {
  return nowMs + ANSWER_TIME_MS;
}

export { POINTS_PER_CORRECT };
