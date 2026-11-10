import { ANSWER_TIME_MS, QUESTIONS_PER_LEVEL } from "./constants.js";
import { isLevelUnlocked } from "./gating.js";
import type { GameCorePorts } from "./ports.js";
import { countCorrect, gradeAnswer, sumScore } from "./scoring.js";
import type {
  GradedAnswer,
  LevelDefinition,
  LevelRunResult,
  PlayerAnswer,
  Question,
  SinglePlayerProgress,
} from "./types.js";

export type LevelSessionState = {
  levelIndex: number;
  questionIndex: number;
  deadlineMs: number;
  finished: boolean;
  answers: GradedAnswer[];
};

export type SubmitResult =
  | { ok: true; graded: GradedAnswer; finished: boolean; result?: LevelRunResult }
  | { ok: false; reason: "finished" | "locked" | "bad_index" | "format_mismatch" };

/**
 * In-memory single-level run. Timer deadlines come only from ClockPort.
 */
export class LevelSession {
  private readonly ports: GameCorePorts;
  private readonly level: LevelDefinition;
  private readonly questions: Question[];
  private state: LevelSessionState;

  private constructor(ports: GameCorePorts, level: LevelDefinition, questions: Question[]) {
    this.ports = ports;
    this.level = level;
    this.questions = questions;
    const now = ports.clock.nowMs();
    this.state = {
      levelIndex: level.levelIndex,
      questionIndex: 0,
      deadlineMs: now + ANSWER_TIME_MS,
      finished: false,
      answers: [],
    };
  }

  /**
   * Start a level if progress unlocks it and the bank has QUESTIONS_PER_LEVEL items.
   * Throws if the definition is invalid; returns null if the level is locked.
   */
  static start(
    ports: GameCorePorts,
    progress: SinglePlayerProgress,
    level: LevelDefinition,
  ): LevelSession | null {
    if (level.questions.length !== QUESTIONS_PER_LEVEL) {
      throw new Error(
        `Level ${level.levelIndex} must have exactly ${QUESTIONS_PER_LEVEL} questions`,
      );
    }
    if (!isLevelUnlocked(progress, level.levelIndex)) {
      return null;
    }
    return new LevelSession(ports, level, level.questions);
  }

  getState(): Readonly<LevelSessionState> {
    return this.state;
  }

  currentQuestion(): Question | null {
    if (this.state.finished) {
      return null;
    }
    return this.questions[this.state.questionIndex] ?? null;
  }

  remainingMs(): number {
    if (this.state.finished) {
      return 0;
    }
    return Math.max(0, this.state.deadlineMs - this.ports.clock.nowMs());
  }

  isTimedOut(): boolean {
    return !this.state.finished && this.ports.clock.nowMs() >= this.state.deadlineMs;
  }

  /**
   * Submit an answer for the current question, or null to explicitly timeout.
   * Auto-marks timeout when the ClockPort deadline has passed.
   */
  submit(answer: PlayerAnswer | null): SubmitResult {
    if (this.state.finished) {
      return { ok: false, reason: "finished" };
    }

    const question = this.questions[this.state.questionIndex];
    if (!question) {
      return { ok: false, reason: "bad_index" };
    }

    const timedOut = answer === null || this.ports.clock.nowMs() >= this.state.deadlineMs;
    if (!timedOut && answer !== null && answer.format !== question.format) {
      return { ok: false, reason: "format_mismatch" };
    }

    const graded = gradeAnswer(question, timedOut ? null : answer, timedOut);
    const answers = [...this.state.answers, graded];
    const nextIndex = this.state.questionIndex + 1;
    const finished = nextIndex >= this.questions.length;

    if (finished) {
      this.state = {
        ...this.state,
        answers,
        questionIndex: nextIndex,
        finished: true,
        deadlineMs: this.state.deadlineMs,
      };
      return {
        ok: true,
        graded,
        finished: true,
        result: this.buildResult(answers),
      };
    }

    const now = this.ports.clock.nowMs();
    this.state = {
      ...this.state,
      answers,
      questionIndex: nextIndex,
      deadlineMs: now + ANSWER_TIME_MS,
      finished: false,
    };
    this.ports.analytics?.track("question_answered", {
      levelIndex: this.level.levelIndex,
      questionId: question.id,
      correct: graded.correct,
      timedOut: graded.timedOut,
    });
    return { ok: true, graded, finished: false };
  }

  private buildResult(answers: GradedAnswer[]): LevelRunResult {
    return {
      levelIndex: this.level.levelIndex,
      totalQuestions: this.questions.length,
      correctCount: countCorrect(answers),
      score: sumScore(answers),
      answers,
    };
  }
}
