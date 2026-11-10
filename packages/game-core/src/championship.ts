/**
 * Championship rules (pure) — calendar window, entry fee → prize pool, winner selection.
 * Server remains source of truth; clients never invent pool / payout amounts.
 */

export const CHAMPIONSHIP_ENTRY_PRODUCT_ID = "championship-entry";

/** Stub money units for a paid entry (no real Stars / IAP secrets). */
export const DEFAULT_ENTRY_FEE_MONEY = 10;

/** Fraction of each entry fee that funds the prize pool (MVP §9 default). */
export const DEFAULT_PRIZE_POOL_SHARE = 0.7;

/**
 * Days of the calendar month when entry is allowed (1–31).
 * Stub default: open most of the month so local demos work; override in config.
 */
export const DEFAULT_OPEN_DAYS_OF_MONTH: readonly number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 29, 30, 31,
];

export type ChampionshipConfig = {
  openDaysOfMonth: readonly number[];
  entryFeeMoney: number;
  /** 0..1 share of entry fee added to the prize pool. */
  prizePoolShare: number;
  productId: string;
  /** How many scored questions in one championship run. */
  questionsPerRun: number;
};

export const DEFAULT_CHAMPIONSHIP_CONFIG: ChampionshipConfig = {
  openDaysOfMonth: DEFAULT_OPEN_DAYS_OF_MONTH,
  entryFeeMoney: DEFAULT_ENTRY_FEE_MONEY,
  prizePoolShare: DEFAULT_PRIZE_POOL_SHARE,
  productId: CHAMPIONSHIP_ENTRY_PRODUCT_ID,
  questionsPerRun: 3,
};

export type ChampionshipPeriodStatus = "open" | "closed" | "settled";

export type ChampionshipEntrySnapshot = {
  playerId: string;
  displayName?: string;
  enteredAtMs: number;
  receiptId: string;
  /** Best score submitted for this period (server-graded). */
  score: number;
  runFinished: boolean;
};

export function normalizeOpenDays(days: readonly number[]): number[] {
  const unique = new Set<number>();
  for (const day of days) {
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new Error(`Invalid championship open day: ${day}`);
    }
    unique.add(day);
  }
  return [...unique].sort((a, b) => a - b);
}

export function createChampionshipConfig(
  overrides: Partial<ChampionshipConfig> = {},
): ChampionshipConfig {
  const base = { ...DEFAULT_CHAMPIONSHIP_CONFIG, ...overrides };
  return {
    ...base,
    openDaysOfMonth: normalizeOpenDays(base.openDaysOfMonth),
    entryFeeMoney: Math.max(1, Math.floor(base.entryFeeMoney)),
    prizePoolShare: Math.min(1, Math.max(0, base.prizePoolShare)),
    questionsPerRun: Math.max(1, Math.floor(base.questionsPerRun)),
  };
}

/** Period key = calendar month UTC (MVP: one championship window per month). */
export function championshipPeriodKey(now: Date): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function isChampionshipOpenOn(
  now: Date,
  config: ChampionshipConfig = DEFAULT_CHAMPIONSHIP_CONFIG,
): boolean {
  const day = now.getUTCDate();
  return config.openDaysOfMonth.includes(day);
}

/** Integer contribution from one paid entry into the prize pool. */
export function prizeContributionFromEntry(
  entryFeeMoney: number,
  prizePoolShare: number,
): number {
  const fee = Math.max(0, Math.floor(entryFeeMoney));
  const share = Math.min(1, Math.max(0, prizePoolShare));
  return Math.floor(fee * share);
}

export type WinnerSelection = {
  winnerPlayerId: string | null;
  /** When several share the top score, MVP picks earliest entry (single winner). */
  tiedPlayerIds: string[];
};

/**
 * MVP winner rule (§9 stub): highest server score wins.
 * Ties → earliest enteredAtMs (stable single winner); tiedPlayerIds lists all top scorers.
 */
export function selectChampionshipWinner(
  entries: readonly ChampionshipEntrySnapshot[],
): WinnerSelection {
  const finished = entries.filter((e) => e.runFinished);
  if (finished.length === 0) {
    return { winnerPlayerId: null, tiedPlayerIds: [] };
  }
  let bestScore = -1;
  for (const entry of finished) {
    if (entry.score > bestScore) {
      bestScore = entry.score;
    }
  }
  const top = finished
    .filter((e) => e.score === bestScore)
    .slice()
    .sort((a, b) => a.enteredAtMs - b.enteredAtMs || a.playerId.localeCompare(b.playerId));
  return {
    winnerPlayerId: top[0]?.playerId ?? null,
    tiedPlayerIds: top.map((e) => e.playerId),
  };
}

export function assertValidStubChampionshipReceipt(receipt: {
  provider: string;
  receiptId: string;
  productId: string;
  expectedProductId?: string;
}): void {
  const expected = receipt.expectedProductId ?? CHAMPIONSHIP_ENTRY_PRODUCT_ID;
  if (!receipt.provider || !receipt.receiptId || !receipt.productId) {
    throw new Error("provider, receiptId and productId required");
  }
  if (
    receipt.provider !== "stub-telegram" &&
    receipt.provider !== "stub-web" &&
    receipt.provider !== "stub-play"
  ) {
    throw new Error(`Unsupported payment provider stub: ${receipt.provider}`);
  }
  if (!receipt.receiptId.startsWith("stub:")) {
    throw new Error("Stub receipts must use receiptId prefix stub:");
  }
  if (receipt.productId !== expected) {
    throw new Error(`Expected product ${expected}, got ${receipt.productId}`);
  }
}
