import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ANSWER_TIME_MS, POINTS_PER_CORRECT, QUESTIONS_PER_LEVEL, gradeAnswer, sumScore } from "./index.js";
import { createGameCore } from "./engine.js";
import { LevelSession } from "./session.js";
import {
  createEmptyProgress,
  applyLevelResult,
} from "./gating.js";
import {
  createFakeClock,
  createTestPorts,
  makeLevel,
  makeSingleChoice,
  progressWithCompletedLevels,
} from "./test/fakes.js";
import type { MultiChoiceQuestion, TextQuestion } from "./types.js";

describe("gradeAnswer", () => {
  it("scores a correct single-choice answer", () => {
    const q = makeSingleChoice("q1", "b");
    const graded = gradeAnswer(q, { format: "single_choice", optionId: "b" }, false);
    assert.equal(graded.correct, true);
    assert.equal(graded.points, POINTS_PER_CORRECT);
    assert.equal(graded.timedOut, false);
  });

  it("scores an incorrect single-choice answer as zero", () => {
    const q = makeSingleChoice("q1", "a");
    const graded = gradeAnswer(q, { format: "single_choice", optionId: "c" }, false);
    assert.equal(graded.correct, false);
    assert.equal(graded.points, 0);
  });

  it("treats timeout as incorrect with zero points", () => {
    const q = makeSingleChoice("q1", "a");
    const graded = gradeAnswer(q, { format: "single_choice", optionId: "a" }, true);
    assert.equal(graded.correct, false);
    assert.equal(graded.points, 0);
    assert.equal(graded.timedOut, true);
  });

  it("requires an exact multi-choice set match", () => {
    const q: MultiChoiceQuestion = {
      id: "m1",
      format: "multi_choice",
      locationTheme: "egypt",
      domain: "art",
      difficulty: "medium",
      prompt: "Pick all",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      correctOptionIds: ["a", "c"],
    };
    assert.equal(
      gradeAnswer(q, { format: "multi_choice", optionIds: ["c", "a"] }, false).correct,
      true,
    );
    assert.equal(
      gradeAnswer(q, { format: "multi_choice", optionIds: ["a"] }, false).correct,
      false,
    );
    assert.equal(
      gradeAnswer(q, { format: "multi_choice", optionIds: ["a", "b", "c"] }, false).correct,
      false,
    );
  });

  it("normalizes free-text answers (stub)", () => {
    const q: TextQuestion = {
      id: "t1",
      format: "text",
      locationTheme: "egypt",
      domain: "history",
      difficulty: "hard",
      prompt: "Capital?",
      acceptedAnswers: ["Cairo", "Каир"],
    };
    assert.equal(gradeAnswer(q, { format: "text", text: "  cairo " }, false).correct, true);
    assert.equal(gradeAnswer(q, { format: "text", text: "Каир" }, false).correct, true);
    assert.equal(gradeAnswer(q, { format: "text", text: "Alexandria" }, false).correct, false);
  });
});

describe("sumScore", () => {
  it("sums points across graded answers", () => {
    const answers = [
      gradeAnswer(makeSingleChoice("1", "a"), { format: "single_choice", optionId: "a" }, false),
      gradeAnswer(makeSingleChoice("2", "a"), { format: "single_choice", optionId: "b" }, false),
      gradeAnswer(makeSingleChoice("3", "a"), null, true),
    ];
    assert.equal(sumScore(answers), POINTS_PER_CORRECT);
  });
});

describe("LevelSession timer via ClockPort", () => {
  it("auto-fails the answer after ANSWER_TIME_MS", () => {
    const clock = createFakeClock(1_000);
    const ports = createTestPorts(clock);
    const session = LevelSession.start(ports, createEmptyProgress(), makeLevel(1));
    assert.ok(session);
    clock.advance(ANSWER_TIME_MS);
    const result = session!.submit({ format: "single_choice", optionId: "a" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.graded.timedOut, true);
      assert.equal(result.graded.points, 0);
    }
  });

  it("accepts a correct answer before the deadline", () => {
    const clock = createFakeClock(0);
    const ports = createTestPorts(clock);
    const session = LevelSession.start(ports, createEmptyProgress(), makeLevel(1, "a"));
    assert.ok(session);
    clock.advance(ANSWER_TIME_MS - 1);
    const result = session!.submit({ format: "single_choice", optionId: "a" });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.graded.correct, true);
      assert.equal(result.graded.points, POINTS_PER_CORRECT);
    }
  });

  it("scores a full perfect run as QUESTIONS_PER_LEVEL points", () => {
    const clock = createFakeClock(0);
    const ports = createTestPorts(clock);
    const engine = createGameCore(ports);
    const session = engine.startLevel(makeLevel(1, "a"));
    assert.ok(session);

    let finished = false;
    let runScore = 0;
    for (let i = 0; i < QUESTIONS_PER_LEVEL; i += 1) {
      clock.advance(100);
      const result = session!.submit({ format: "single_choice", optionId: "a" });
      assert.equal(result.ok, true);
      if (result.ok && result.finished && result.result) {
        finished = true;
        runScore = result.result.score;
      }
    }
    assert.equal(finished, true);
    assert.equal(runScore, QUESTIONS_PER_LEVEL * POINTS_PER_CORRECT);

    const progress = engine.commitRun({
      levelIndex: 1,
      totalQuestions: QUESTIONS_PER_LEVEL,
      correctCount: QUESTIONS_PER_LEVEL,
      score: runScore,
      answers: [],
    });
    assert.equal(progress.levels[1]?.bestScore, runScore);
    assert.equal(engine.isLevelUnlocked(2), true);
  });

  it("refuses to start a locked level", () => {
    const ports = createTestPorts();
    const engine = createGameCore(ports);
    assert.equal(engine.startLevel(makeLevel(2)), null);
  });

  it("allows starting level 11 only after a gated block", () => {
    const ports = createTestPorts();
    const engine = createGameCore(ports);
    engine.setProgress(progressWithCompletedLevels(10, 100));
    assert.ok(engine.startLevel(makeLevel(11)));
  });
});

describe("applyLevelResult scoring persistence", () => {
  it("keeps bestScore when a later run scores lower", () => {
    let progress = applyLevelResult(createEmptyProgress(), 1, 25);
    progress = applyLevelResult(progress, 1, 10);
    assert.equal(progress.levels[1]?.bestScore, 25);
    assert.equal(progress.levels[1]?.lastScore, 10);
    assert.equal(progress.levels[1]?.attemptCount, 2);
  });
});
