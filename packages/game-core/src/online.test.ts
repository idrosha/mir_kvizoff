import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ONLINE_ROUNDS_PER_MATCH,
  ONLINE_RATING_START,
  applyOnlineRating,
  assertOnlineMatchDefinition,
  computeOnlineRatingDelta,
  gradeOnlineAnswer,
  toPublicQuestion,
} from "./online.js";
import { makeSingleChoice } from "./test/fakes.js";
import type { MultiChoiceQuestion, TextQuestion } from "./types.js";

describe("toPublicQuestion", () => {
  it("strips single-choice correctOptionId", () => {
    const q = makeSingleChoice("q1", "b");
    const pub = toPublicQuestion(q);
    assert.equal(pub.format, "single_choice");
    assert.equal("correctOptionId" in pub, false);
    assert.equal(pub.id, "q1");
  });

  it("strips multi-choice correctOptionIds", () => {
    const q: MultiChoiceQuestion = {
      id: "m1",
      format: "multi_choice",
      locationTheme: "rome",
      domain: "food",
      difficulty: "medium",
      prompt: "Pick",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      correctOptionIds: ["a"],
    };
    const pub = toPublicQuestion(q);
    assert.equal("correctOptionIds" in pub, false);
  });

  it("strips text acceptedAnswers", () => {
    const q: TextQuestion = {
      id: "t1",
      format: "text",
      locationTheme: "paris",
      domain: "cinema",
      difficulty: "hard",
      prompt: "Title?",
      acceptedAnswers: ["Amelie", "Амели"],
    };
    const pub = toPublicQuestion(q);
    assert.equal("acceptedAnswers" in pub, false);
    assert.equal(pub.format, "text");
  });
});

describe("gradeOnlineAnswer", () => {
  it("rejects late answers via server deadline (anti-cheat window)", () => {
    const q = makeSingleChoice("q1", "a");
    const graded = gradeOnlineAnswer({
      question: q,
      answer: { format: "single_choice", optionId: "a" },
      nowMs: 20_000,
      deadlineMs: 10_000,
    });
    assert.equal(graded.timedOut, true);
    assert.equal(graded.correct, false);
    assert.equal(graded.points, 0);
  });

  it("accepts free-text when inside the window", () => {
    const q: TextQuestion = {
      id: "t1",
      format: "text",
      locationTheme: "paris",
      domain: "cinema",
      difficulty: "hard",
      prompt: "Film?",
      acceptedAnswers: ["Amélie", "Amelie"],
    };
    const graded = gradeOnlineAnswer({
      question: q,
      answer: { format: "text", text: "  amelie " },
      nowMs: 5_000,
      deadlineMs: 10_000,
    });
    assert.equal(graded.correct, true);
    assert.equal(graded.timedOut, false);
  });
});

describe("online rating", () => {
  it("starts at ONLINE_RATING_START and applies score-diff delta", () => {
    assert.equal(ONLINE_RATING_START, 1000);
    const delta = computeOnlineRatingDelta(3, 1);
    assert.equal(delta, 20);
    assert.equal(applyOnlineRating(ONLINE_RATING_START, delta), 1020);
    assert.equal(applyOnlineRating(5, -100), 0);
  });
});

describe("assertOnlineMatchDefinition", () => {
  it("requires three themed rounds covering all formats", () => {
    assert.equal(ONLINE_ROUNDS_PER_MATCH, 3);
    const single = makeSingleChoice("s", "a");
    const multi: MultiChoiceQuestion = {
      id: "m",
      format: "multi_choice",
      locationTheme: "rome",
      domain: "food",
      difficulty: "easy",
      prompt: "m",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      correctOptionIds: ["a"],
    };
    const text: TextQuestion = {
      id: "t",
      format: "text",
      locationTheme: "paris",
      domain: "cinema",
      difficulty: "medium",
      prompt: "t",
      acceptedAnswers: ["x"],
    };
    assert.doesNotThrow(() =>
      assertOnlineMatchDefinition({
        rounds: [
          { kind: "single_choice", theme: "egypt-history", question: single },
          { kind: "multi_choice", theme: "rome-food", question: multi },
          { kind: "text", theme: "paris-cinema", question: text },
        ],
      }),
    );
    assert.throws(() =>
      assertOnlineMatchDefinition({
        rounds: [
          { kind: "single_choice", theme: "same", question: single },
          { kind: "multi_choice", theme: "same", question: multi },
          { kind: "text", theme: "same", question: text },
        ],
      }),
    );
  });
});
