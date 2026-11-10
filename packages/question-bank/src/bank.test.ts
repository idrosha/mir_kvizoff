import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { QUESTIONS_PER_LEVEL, BLOCK_SIZE } from "@mir-games/game-core";
import { adaptBankLevel, mapDifficulty, mapDomain } from "./adapt.js";
import { BANK_LEVEL_FILES } from "./bank-data.js";
import {
  COUNTRY_SLUGS,
  COUNTRY_TITLES_RU,
  getLevel,
  MAP_LOCATIONS,
  SINGLE_PLAYER_LEVELS,
} from "./index.js";

describe("question-bank import", () => {
  it("embeds exactly one block of 10 levels", () => {
    assert.equal(BANK_LEVEL_FILES.length, BLOCK_SIZE);
    assert.equal(SINGLE_PLAYER_LEVELS.length, BLOCK_SIZE);
    assert.deepEqual(
      BANK_LEVEL_FILES.map((f) => f.levelId),
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    );
  });

  it("exposes all ten countries", () => {
    assert.deepEqual(COUNTRY_SLUGS, [
      "egypt",
      "italy",
      "japan",
      "france",
      "russia",
      "brazil",
      "india",
      "china",
      "greece",
      "mexico",
    ]);
    assert.deepEqual(COUNTRY_TITLES_RU, [
      "Египет",
      "Италия",
      "Япония",
      "Франция",
      "Россия",
      "Бразилия",
      "Индия",
      "Китай",
      "Греция",
      "Мексика",
    ]);
    assert.equal(MAP_LOCATIONS.length, 10);
  });

  it("adapts each level to QUESTIONS_PER_LEVEL with valid formats", () => {
    for (const file of BANK_LEVEL_FILES) {
      const level = adaptBankLevel(file);
      assert.equal(level.questions.length, QUESTIONS_PER_LEVEL);
      assert.equal(level.levelIndex, file.levelId);
      assert.equal(level.locationTheme, file.levelSlug);
      for (const q of level.questions) {
        if (q.format === "single_choice") {
          assert.equal(q.options.length, 4);
          assert.ok(q.options.some((o) => o.id === q.correctOptionId));
        } else if (q.format === "multi_choice") {
          assert.ok(q.options.length >= 5 && q.options.length <= 10);
          assert.ok(q.correctOptionIds.length >= 1);
        } else {
          assert.fail(`unexpected format ${(q as { format: string }).format}`);
        }
      }
    }
  });

  it("getLevel returns definitions for 1..10", () => {
    for (let i = 1; i <= 10; i += 1) {
      const level = getLevel(i);
      assert.ok(level);
      assert.equal(level.levelIndex, i);
    }
    assert.equal(getLevel(11), undefined);
  });

  it("maps domains and difficulties", () => {
    assert.equal(mapDomain("история"), "history");
    assert.equal(mapDomain("еда"), "food");
    assert.equal(mapDomain("география"), "other");
    assert.equal(mapDomain("неизвестно"), "other");
    assert.equal(mapDifficulty(1), "easy");
    assert.equal(mapDifficulty(2), "easy");
    assert.equal(mapDifficulty(3), "medium");
    assert.equal(mapDifficulty(5), "hard");
  });
});
