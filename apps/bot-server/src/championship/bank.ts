import {
  assertOnlineMatchDefinition,
  type OnlineMatchDefinition,
  type Question,
} from "@mir-games/game-core";

/**
 * Championship stub bank — three formats, answers stay server-side.
 * Distinct ids from online so audit logs do not collide.
 */
export function createChampionshipBank(): OnlineMatchDefinition {
  const single: Question = {
    id: "champ-egypt-history-1",
    format: "single_choice",
    locationTheme: "egypt",
    domain: "history",
    difficulty: "easy",
    prompt: "Столица Древнего Египта в период Нового царства чаще всего ассоциируется с…",
    options: [
      { id: "a", label: "Мемфисом" },
      { id: "b", label: "Фивами" },
      { id: "c", label: "Александрией" },
      { id: "d", label: "Карфагеном" },
    ],
    correctOptionId: "b",
  };

  const multi: Question = {
    id: "champ-world-geo-1",
    format: "multi_choice",
    locationTheme: "world",
    domain: "history",
    difficulty: "medium",
    prompt: "Какие страны входят в первую десятку карты Мир Квизов (блок 1)?",
    options: [
      { id: "a", label: "Египет" },
      { id: "b", label: "Канада" },
      { id: "c", label: "Япония" },
      { id: "d", label: "Мексика" },
      { id: "e", label: "Австралия" },
    ],
    correctOptionIds: ["a", "c", "d"],
  };

  const text: Question = {
    id: "champ-italy-art-1",
    format: "text",
    locationTheme: "italy",
    domain: "art",
    difficulty: "hard",
    prompt: "Кто написал «Мону Лизу»? (фамилия)",
    acceptedAnswers: [
      "да винчи",
      "давинчи",
      "Leonardo da Vinci",
      "Леонардо да Винчи",
      "da Vinci",
      "Da Vinci",
    ],
  };

  const def: OnlineMatchDefinition = {
    rounds: [
      { kind: "single_choice", theme: "egypt-history", question: single },
      { kind: "multi_choice", theme: "world-geo", question: multi },
      { kind: "text", theme: "italy-art", question: text },
    ],
  };
  assertOnlineMatchDefinition(def);
  return def;
}
