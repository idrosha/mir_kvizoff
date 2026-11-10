import {
  assertOnlineMatchDefinition,
  type OnlineMatchDefinition,
  type Question,
} from "@mir-games/game-core";

/**
 * Phase 6 stub question bank: three themed rounds covering all formats.
 * Full answers stay on the server — clients only receive PublicQuestion.
 */
export function createOnlineMatchBank(): OnlineMatchDefinition {
  const single: Question = {
    id: "online-egypt-history-1",
    format: "single_choice",
    locationTheme: "egypt",
    domain: "history",
    difficulty: "easy",
    prompt: "Какой фараон связан с гробницей KV62 в Долине Царей?",
    mediaId: "egypt-tomb",
    options: [
      { id: "a", label: "Рамсес II" },
      { id: "b", label: "Тутанхамон" },
      { id: "c", label: "Хеопс" },
      { id: "d", label: "Клеопатра" },
    ],
    correctOptionId: "b",
  };

  const multi: Question = {
    id: "online-rome-food-1",
    format: "multi_choice",
    locationTheme: "rome",
    domain: "food",
    difficulty: "medium",
    prompt: "Что из перечисленного — традиционные итальянские блюда?",
    options: [
      { id: "a", label: "Пицца" },
      { id: "b", label: "Суши" },
      { id: "c", label: "Паста" },
      { id: "d", label: "Тирамису" },
      { id: "e", label: "Тако" },
    ],
    correctOptionIds: ["a", "c", "d"],
  };

  const text: Question = {
    id: "online-paris-cinema-1",
    format: "text",
    locationTheme: "paris",
    domain: "cinema",
    difficulty: "hard",
    prompt: "Как называется фильм Жана-Пьера Жёне про девушку из Монмартра? (имя героини)",
    acceptedAnswers: ["Амели", "Amelie", "Amélie", "Amélie Poulain", "Амели Пулен"],
  };

  const def: OnlineMatchDefinition = {
    rounds: [
      { kind: "single_choice", theme: "egypt-history", question: single },
      { kind: "multi_choice", theme: "rome-food", question: multi },
      { kind: "text", theme: "paris-cinema", question: text },
    ],
  };
  assertOnlineMatchDefinition(def);
  return def;
}

/** Deterministic stub-opponent answers (server-graded, never client-trusted). */
export function stubOpponentAnswerForRound(roundIndex: number): import("@mir-games/game-core").PlayerAnswer {
  switch (roundIndex) {
    case 0:
      return { format: "single_choice", optionId: "b" };
    case 1:
      // Intentionally incomplete — scores 0 so humans can win the demo.
      return { format: "multi_choice", optionIds: ["a"] };
    case 2:
      return { format: "text", text: "Amelie" };
    default:
      return { format: "text", text: "" };
  }
}
