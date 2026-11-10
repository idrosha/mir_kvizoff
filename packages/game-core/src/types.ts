/** Question / avatar / progress models — no platform types. */

export type KnowledgeDomain =
  | "cinema"
  | "medicine"
  | "food"
  | "art"
  | "history"
  | "literature"
  | "other";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionFormat = "single_choice" | "multi_choice" | "text";

export type ChoiceOption = {
  id: string;
  label: string;
};

export type QuestionBase = {
  id: string;
  locationTheme: string;
  domain: KnowledgeDomain;
  difficulty: Difficulty;
  prompt: string;
  /** Optional image / media id resolved by clients. */
  mediaId?: string;
};

export type SingleChoiceQuestion = QuestionBase & {
  format: "single_choice";
  options: [ChoiceOption, ChoiceOption, ChoiceOption, ChoiceOption];
  correctOptionId: string;
};

export type MultiChoiceQuestion = QuestionBase & {
  format: "multi_choice";
  /** Up to 10 options; one or more may be correct. */
  options: ChoiceOption[];
  correctOptionIds: string[];
};

/** Free-text stub — normalization / accept lives on server for online. */
export type TextQuestion = QuestionBase & {
  format: "text";
  /** Canonical answers for offline / single-player stub grading. */
  acceptedAnswers: string[];
};

export type Question = SingleChoiceQuestion | MultiChoiceQuestion | TextQuestion;

export type LevelDefinition = {
  /** 1-based level index in the single-player chain. */
  levelIndex: number;
  locationTheme: string;
  questions: Question[];
};

export type EquipmentSlot =
  | "hat"
  | "glasses"
  | "shirt"
  | "sweater"
  | "accessory"
  | "pants"
  | "shoes";

export type EquipmentItem = {
  id: string;
  slot: EquipmentSlot;
  /** Championship-only catalog flag — unlock is server-confirmed later. */
  championshipOnly?: boolean;
};

/** Cosmetic loadout shown on single / online / championship screens. */
export type AvatarLoadout = {
  equipped: Partial<Record<EquipmentSlot, string>>;
};

export type LevelRecord = {
  levelIndex: number;
  /** True once the player has finished the level at least once. */
  completed: boolean;
  /** Best score (points) for this level. */
  bestScore: number;
  /** Score from the latest completed run. */
  lastScore: number;
  /** Number of finished attempts (including paid retries). */
  attemptCount: number;
};

export type SinglePlayerProgress = {
  /** Sparse map keyed by levelIndex. */
  levels: Record<number, LevelRecord>;
};

export type PlayerAnswer =
  | { format: "single_choice"; optionId: string }
  | { format: "multi_choice"; optionIds: string[] }
  | { format: "text"; text: string };

export type GradedAnswer = {
  questionId: string;
  correct: boolean;
  points: number;
  timedOut: boolean;
};

export type LevelRunResult = {
  levelIndex: number;
  totalQuestions: number;
  correctCount: number;
  score: number;
  answers: GradedAnswer[];
};
