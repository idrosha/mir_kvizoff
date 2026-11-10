import { POINTS_PER_CORRECT } from "./constants.js";
import type {
  GradedAnswer,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  SingleChoiceQuestion,
  TextQuestion,
} from "./types.js";

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSingleCorrect(question: SingleChoiceQuestion, answer: PlayerAnswer): boolean {
  return answer.format === "single_choice" && answer.optionId === question.correctOptionId;
}

function isMultiCorrect(question: MultiChoiceQuestion, answer: PlayerAnswer): boolean {
  if (answer.format !== "multi_choice") {
    return false;
  }
  const expected = new Set(question.correctOptionIds);
  const got = new Set(answer.optionIds);
  if (expected.size !== got.size) {
    return false;
  }
  for (const id of expected) {
    if (!got.has(id)) {
      return false;
    }
  }
  return true;
}

function isTextCorrect(question: TextQuestion, answer: PlayerAnswer): boolean {
  if (answer.format !== "text") {
    return false;
  }
  const normalized = normalizeText(answer.text);
  return question.acceptedAnswers.some((a) => normalizeText(a) === normalized);
}

/** Grade one answer. Timed-out answers always score 0. */
export function gradeAnswer(
  question: Question,
  answer: PlayerAnswer | null,
  timedOut: boolean,
): GradedAnswer {
  if (timedOut || answer === null) {
    return {
      questionId: question.id,
      correct: false,
      points: 0,
      timedOut: true,
    };
  }

  let correct = false;
  switch (question.format) {
    case "single_choice":
      correct = isSingleCorrect(question, answer);
      break;
    case "multi_choice":
      correct = isMultiCorrect(question, answer);
      break;
    case "text":
      correct = isTextCorrect(question, answer);
      break;
  }

  return {
    questionId: question.id,
    correct,
    points: correct ? POINTS_PER_CORRECT : 0,
    timedOut: false,
  };
}

/** Sum points from graded answers (MVP: count of correct × POINTS_PER_CORRECT). */
export function sumScore(answers: GradedAnswer[]): number {
  return answers.reduce((total, a) => total + a.points, 0);
}

export function countCorrect(answers: GradedAnswer[]): number {
  return answers.reduce((total, a) => total + (a.correct ? 1 : 0), 0);
}
