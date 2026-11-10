import {
  QUESTIONS_PER_LEVEL,
  type ChoiceOption,
  type Difficulty,
  type KnowledgeDomain,
  type LevelDefinition,
  type MultiChoiceQuestion,
  type Question,
  type SingleChoiceQuestion,
} from "@mir-games/game-core";
import type { BankLevelFile, BankQuestion } from "./bank-schema.js";

const DOMAIN_MAP: Record<string, KnowledgeDomain> = {
  история: "history",
  кино: "cinema",
  медицина: "medicine",
  еда: "food",
  напитки: "food",
  искусство: "art",
  архитектура: "art",
  литература: "literature",
  география: "other",
  музыка: "other",
  наука: "other",
  спорт: "other",
  традиции: "other",
  природа: "other",
};

export function mapDomain(raw: string): KnowledgeDomain {
  return DOMAIN_MAP[raw] ?? "other";
}

/** Bank difficulty 1–5 → game-core easy/medium/hard. */
export function mapDifficulty(n: number): Difficulty {
  if (n <= 2) {
    return "easy";
  }
  if (n === 3) {
    return "medium";
  }
  return "hard";
}

function toOptions(question: BankQuestion): ChoiceOption[] {
  return question.options.map((opt) => ({ id: opt.id, label: opt.text }));
}

function adaptQuestion(question: BankQuestion, locationTheme: string): Question {
  const base = {
    id: question.id,
    locationTheme,
    domain: mapDomain(question.domain),
    difficulty: mapDifficulty(question.difficulty),
    prompt: question.prompt,
  };

  if (question.format === "single_choice") {
    const options = toOptions(question);
    if (options.length !== 4) {
      throw new Error(`Question ${question.id}: single_choice needs 4 options, got ${options.length}`);
    }
    const correct = question.correctOptionIds[0];
    if (!correct) {
      throw new Error(`Question ${question.id}: missing correctOptionIds`);
    }
    const adapted: SingleChoiceQuestion = {
      ...base,
      format: "single_choice",
      options: options as [ChoiceOption, ChoiceOption, ChoiceOption, ChoiceOption],
      correctOptionId: correct,
    };
    return adapted;
  }

  if (question.correctOptionIds.length < 1) {
    throw new Error(`Question ${question.id}: multi_choice needs correctOptionIds`);
  }
  const adapted: MultiChoiceQuestion = {
    ...base,
    format: "multi_choice",
    options: toOptions(question),
    correctOptionIds: [...question.correctOptionIds],
  };
  return adapted;
}

export function adaptBankLevel(file: BankLevelFile): LevelDefinition {
  if (file.questions.length !== QUESTIONS_PER_LEVEL) {
    throw new Error(
      `Level ${file.levelId} (${file.levelSlug}) must have ${QUESTIONS_PER_LEVEL} questions, got ${file.questions.length}`,
    );
  }
  return {
    levelIndex: file.levelId,
    locationTheme: file.levelSlug,
    questions: file.questions.map((q) => adaptQuestion(q, file.levelSlug)),
  };
}
