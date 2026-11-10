import { adaptBankLevel } from "./adapt.js";
import { BANK_LEVEL_FILES } from "./bank-data.js";
import { mapLocationsFromBank, type MapLocation } from "./map.js";
import type { LevelDefinition } from "@mir-games/game-core";

export type { MapLocation } from "./map.js";
export type { BankLevelFile, BankQuestion, BankOption } from "./bank-schema.js";
export { adaptBankLevel, mapDifficulty, mapDomain } from "./adapt.js";
export { mapLocationsFromBank } from "./map.js";

/** All single-player levels in chain order (block 1: levels 1–10). */
export const SINGLE_PLAYER_LEVELS: LevelDefinition[] = BANK_LEVEL_FILES.map(adaptBankLevel);

const byIndex = new Map<number, LevelDefinition>(
  SINGLE_PLAYER_LEVELS.map((level) => [level.levelIndex, level]),
);

export function getLevel(levelIndex: number): LevelDefinition | undefined {
  return byIndex.get(levelIndex);
}

/** Thematic map entries for all countries in the imported bank. */
export const MAP_LOCATIONS: MapLocation[] = mapLocationsFromBank(BANK_LEVEL_FILES);

/** Country slugs in level order. */
export const COUNTRY_SLUGS: string[] = MAP_LOCATIONS.map((loc) => loc.theme);

/** Country titles (ru) in level order. */
export const COUNTRY_TITLES_RU: string[] = MAP_LOCATIONS.map((loc) => loc.title);
