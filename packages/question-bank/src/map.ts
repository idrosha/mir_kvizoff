import type { BankLevelFile } from "./bank-schema.js";

/** Map metadata for thematic locations on the single-player map. */
export type MapLocation = {
  levelIndex: number;
  theme: string;
  title: string;
  blurb: string;
  artClass: string;
};

export function mapLocationsFromBank(files: BankLevelFile[]): MapLocation[] {
  return files
    .slice()
    .sort((a, b) => a.levelId - b.levelId)
    .map((file) => ({
      levelIndex: file.levelId,
      theme: file.levelSlug,
      title: file.country.ru,
      blurb: file.mapHint,
      artClass: `loc-${file.levelSlug}`,
    }));
}
