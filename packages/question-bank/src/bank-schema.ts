/** Wire format for content/question-bank/level-*.json (schemaVersion 1). */

export type BankOption = {
  id: string;
  text: string;
};

export type BankQuestion = {
  id: string;
  format: "single_choice" | "multi_choice";
  domain: string;
  difficulty: number;
  prompt: string;
  imagePrompt?: string | null;
  imageUrl?: string | null;
  options: BankOption[];
  correctOptionIds: string[];
  explanation?: string;
};

export type BankLevelFile = {
  schemaVersion: number;
  levelId: number;
  levelSlug: string;
  country: { ru: string; en: string };
  locale: string;
  mapHint: string;
  questionCount: number;
  questions: BankQuestion[];
};
