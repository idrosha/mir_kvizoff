import {
  CHAMPIONSHIP_ENTRY_PRODUCT_ID,
  assertValidStubChampionshipReceipt,
  championshipPeriodKey,
  createChampionshipConfig,
  gradeOnlineAnswer,
  isChampionshipOpenOn,
  nextRoundDeadlineMs,
  prizeContributionFromEntry,
  selectChampionshipWinner,
  toPublicQuestion,
  type AvatarLoadout,
  type ChampionshipConfig,
  type ChampionshipEntrySnapshot,
  type ChampionshipPeriodStatus,
  type OnlineMatchDefinition,
  type PlayerAnswer,
  type PublicQuestion,
} from "@mir-games/game-core";
import type { ProgressStore } from "../progress/store.js";
import { createChampionshipBank } from "./bank.js";

export type ChampionshipPlayerPublic = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  score: number;
  answeredCurrentRound: boolean;
};

export type ChampionshipRunPublic = {
  periodKey: string;
  status: "active" | "finished";
  roundIndex: number;
  totalRounds: number;
  deadlineMs: number;
  serverNowMs: number;
  roundThemes: string[];
  currentQuestion: PublicQuestion | null;
  you: ChampionshipPlayerPublic;
  yourLastGraded: {
    questionId: string;
    correct: boolean;
    points: number;
    timedOut: boolean;
  } | null;
};

export type ChampionshipStatusPublic = {
  periodKey: string;
  open: boolean;
  periodStatus: ChampionshipPeriodStatus;
  serverNowMs: number;
  openDaysOfMonth: number[];
  entryFeeMoney: number;
  prizePoolShare: number;
  prizePool: number;
  productId: string;
  you: {
    playerId: string;
    displayName?: string;
    avatar: AvatarLoadout;
    moneyBalance: number;
    championshipParticipated: boolean;
    entered: boolean;
    score: number;
    runFinished: boolean;
    runActive: boolean;
  };
  leaderboard: Array<{
    playerId: string;
    displayName?: string;
    score: number;
    runFinished: boolean;
  }>;
  winnerPlayerId: string | null;
  winnerPayout: number | null;
};

type ActiveRun = {
  playerId: string;
  periodKey: string;
  roundIndex: number;
  score: number;
  deadlineMs: number;
  answeredCurrentRound: boolean;
  finished: boolean;
  lastGraded: ChampionshipRunPublic["yourLastGraded"];
};

type PeriodRecord = {
  periodKey: string;
  prizePool: number;
  entries: Map<string, ChampionshipEntrySnapshot>;
  /** Global receipt idempotency across players. */
  processedReceiptIds: Set<string>;
  status: ChampionshipPeriodStatus;
  winnerPlayerId: string | null;
  winnerPayout: number | null;
  audit: Array<{
    atMs: number;
    type: "entry" | "score" | "settle" | "payout";
    playerId?: string;
    amount?: number;
    receiptId?: string;
    detail?: string;
  }>;
};

export type ChampionshipStore = {
  getStatus(playerId: string): ChampionshipStatusPublic;
  enter(
    playerId: string,
    receipt: { provider: string; receiptId: string; productId: string },
  ): ChampionshipStatusPublic;
  startRun(playerId: string): ChampionshipRunPublic;
  getRun(playerId: string): ChampionshipRunPublic;
  submitAnswer(playerId: string, roundIndex: number, answer: PlayerAnswer | null): ChampionshipRunPublic;
  settle(playerId: string, periodKey?: string): ChampionshipStatusPublic;
};

export type ChampionshipStoreOptions = {
  progress: ProgressStore;
  config?: ChampionshipConfig;
  bank?: OnlineMatchDefinition;
  nowMs?: () => number;
};

function defaultAvatar(): AvatarLoadout {
  return {
    equipped: {
      shirt: "starter-shirt",
      pants: "starter-pants",
      shoes: "starter-shoes",
    },
  };
}

export function createInMemoryChampionshipStore(
  options: ChampionshipStoreOptions,
): ChampionshipStore {
  const config = createChampionshipConfig(options.config ?? {});
  const bank = options.bank ?? createChampionshipBank();
  const nowMs = options.nowMs ?? (() => Date.now());
  const progress = options.progress;

  const periods = new Map<string, PeriodRecord>();
  const activeRuns = new Map<string, ActiveRun>();

  function getOrCreatePeriod(periodKey: string): PeriodRecord {
    const existing = periods.get(periodKey);
    if (existing) {
      return existing;
    }
    const created: PeriodRecord = {
      periodKey,
      prizePool: 0,
      entries: new Map(),
      processedReceiptIds: new Set(),
      status: "open",
      winnerPlayerId: null,
      winnerPayout: null,
      audit: [],
    };
    periods.set(periodKey, created);
    return created;
  }

  function currentPeriod(now: Date): PeriodRecord {
    return getOrCreatePeriod(championshipPeriodKey(now));
  }

  function toPublicRun(run: ActiveRun): ChampionshipRunPublic {
    const save = progress.snapshot(run.playerId);
    const round = bank.rounds[run.roundIndex];
    return {
      periodKey: run.periodKey,
      status: run.finished ? "finished" : "active",
      roundIndex: run.roundIndex,
      totalRounds: bank.rounds.length,
      deadlineMs: run.deadlineMs,
      serverNowMs: nowMs(),
      roundThemes: bank.rounds.map((r) => r.theme),
      currentQuestion:
        run.finished || !round ? null : toPublicQuestion(round.question),
      you: {
        playerId: run.playerId,
        displayName: save.displayName,
        avatar: save.avatar ?? defaultAvatar(),
        score: run.score,
        answeredCurrentRound: run.answeredCurrentRound,
      },
      yourLastGraded: run.lastGraded,
    };
  }

  function leaderboardFor(period: PeriodRecord) {
    return [...period.entries.values()]
      .map((e) => ({
        playerId: e.playerId,
        displayName: e.displayName,
        score: e.score,
        runFinished: e.runFinished,
      }))
      .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
  }

  function statusFor(playerId: string): ChampionshipStatusPublic {
    const now = new Date(nowMs());
    const period = currentPeriod(now);
    const open = isChampionshipOpenOn(now, config) && period.status !== "settled";
    const save = progress.snapshot(playerId);
    const entry = period.entries.get(playerId);
    const run = activeRuns.get(playerId);
    return {
      periodKey: period.periodKey,
      open,
      periodStatus: period.status === "open" && !open ? "closed" : period.status,
      serverNowMs: nowMs(),
      openDaysOfMonth: [...config.openDaysOfMonth],
      entryFeeMoney: config.entryFeeMoney,
      prizePoolShare: config.prizePoolShare,
      prizePool: period.prizePool,
      productId: config.productId,
      you: {
        playerId,
        displayName: save.displayName,
        avatar: save.avatar,
        moneyBalance: save.moneyBalance,
        championshipParticipated: save.championshipParticipated,
        entered: Boolean(entry),
        score: entry?.score ?? 0,
        runFinished: entry?.runFinished ?? false,
        runActive: Boolean(run && !run.finished),
      },
      leaderboard: leaderboardFor(period),
      winnerPlayerId: period.winnerPlayerId,
      winnerPayout: period.winnerPayout,
    };
  }

  return {
    getStatus(playerId) {
      progress.getOrCreate(playerId);
      return statusFor(playerId);
    },

    enter(playerId, receipt) {
      const now = new Date(nowMs());
      const period = currentPeriod(now);

      if (period.status === "settled") {
        throw new Error("Championship period already settled");
      }
      if (!isChampionshipOpenOn(now, config)) {
        throw new Error(
          `Championship closed today (UTC day ${now.getUTCDate()}); open days: ${config.openDaysOfMonth.join(",")}`,
        );
      }

      assertValidStubChampionshipReceipt({
        ...receipt,
        expectedProductId: config.productId,
      });

      // Idempotent replay of the same receipt.
      if (period.processedReceiptIds.has(receipt.receiptId)) {
        const existing = period.entries.get(playerId);
        if (existing && existing.receiptId === receipt.receiptId) {
          return statusFor(playerId);
        }
        throw new Error("Receipt already used");
      }

      if (period.entries.has(playerId)) {
        throw new Error("Already entered this championship period");
      }

      const save = progress.getOrCreate(playerId);
      if (save.moneyBalance < config.entryFeeMoney) {
        throw new Error(
          `Not enough money (stub) for entry fee ${config.entryFeeMoney}`,
        );
      }

      // Ledger: charge fee, grow prize pool, unlock championship shop section.
      save.moneyBalance -= config.entryFeeMoney;
      save.processedReceiptIds.push(receipt.receiptId);
      save.updatedAtMs = nowMs();
      progress.markChampionshipParticipated(playerId);

      const contribution = prizeContributionFromEntry(
        config.entryFeeMoney,
        config.prizePoolShare,
      );
      period.prizePool += contribution;
      period.processedReceiptIds.add(receipt.receiptId);
      period.entries.set(playerId, {
        playerId,
        displayName: save.displayName,
        enteredAtMs: nowMs(),
        receiptId: receipt.receiptId,
        score: 0,
        runFinished: false,
      });
      period.audit.push({
        atMs: nowMs(),
        type: "entry",
        playerId,
        amount: contribution,
        receiptId: receipt.receiptId,
        detail: `fee=${config.entryFeeMoney}; pool+=${contribution}`,
      });

      return statusFor(playerId);
    },

    startRun(playerId) {
      const now = new Date(nowMs());
      const period = currentPeriod(now);
      const entry = period.entries.get(playerId);
      if (!entry) {
        throw new Error("Enter championship before starting a run");
      }
      if (entry.runFinished) {
        throw new Error("Championship run already finished for this period");
      }
      const existing = activeRuns.get(playerId);
      if (existing && !existing.finished) {
        return toPublicRun(existing);
      }

      const startedAt = nowMs();
      const run: ActiveRun = {
        playerId,
        periodKey: period.periodKey,
        roundIndex: 0,
        score: 0,
        deadlineMs: nextRoundDeadlineMs(startedAt),
        answeredCurrentRound: false,
        finished: false,
        lastGraded: null,
      };
      activeRuns.set(playerId, run);
      return toPublicRun(run);
    },

    getRun(playerId) {
      const run = activeRuns.get(playerId);
      if (!run) {
        throw new Error("No active championship run");
      }
      return toPublicRun(run);
    },

    submitAnswer(playerId, roundIndex, answer) {
      const run = activeRuns.get(playerId);
      if (!run || run.finished) {
        throw new Error("No active championship run");
      }
      if (roundIndex !== run.roundIndex) {
        throw new Error(`Unexpected roundIndex ${roundIndex}; expected ${run.roundIndex}`);
      }
      if (run.answeredCurrentRound) {
        return toPublicRun(run);
      }

      const round = bank.rounds[run.roundIndex];
      if (!round) {
        throw new Error("Round not found");
      }

      const atMs = nowMs();
      const graded = gradeOnlineAnswer({
        question: round.question,
        answer,
        nowMs: atMs,
        deadlineMs: run.deadlineMs,
      });
      run.score += graded.points;
      run.answeredCurrentRound = true;
      run.lastGraded = {
        questionId: graded.questionId,
        correct: graded.correct,
        points: graded.points,
        timedOut: graded.timedOut,
      };

      const period = getOrCreatePeriod(run.periodKey);
      const entry = period.entries.get(playerId);
      if (entry) {
        entry.score = run.score;
        period.audit.push({
          atMs,
          type: "score",
          playerId,
          amount: graded.points,
          detail: `round=${run.roundIndex}; correct=${graded.correct}`,
        });
      }

      if (run.roundIndex + 1 >= bank.rounds.length) {
        run.finished = true;
        if (entry) {
          entry.runFinished = true;
          entry.score = run.score;
        }
      } else {
        run.roundIndex += 1;
        run.answeredCurrentRound = false;
        run.deadlineMs = nextRoundDeadlineMs(atMs);
      }

      return toPublicRun(run);
    },

    settle(playerId, periodKey) {
      progress.getOrCreate(playerId);
      const now = new Date(nowMs());
      const key = periodKey ?? championshipPeriodKey(now);
      const period = getOrCreatePeriod(key);
      if (period.status === "settled") {
        return statusFor(playerId);
      }

      const { winnerPlayerId } = selectChampionshipWinner([...period.entries.values()]);
      const payout = period.prizePool;
      period.winnerPlayerId = winnerPlayerId;
      period.winnerPayout = winnerPlayerId ? payout : 0;
      period.status = "settled";
      period.audit.push({
        atMs: nowMs(),
        type: "settle",
        playerId: winnerPlayerId ?? undefined,
        amount: period.winnerPayout ?? 0,
      });

      if (winnerPlayerId && payout > 0) {
        const save = progress.getOrCreate(winnerPlayerId);
        save.moneyBalance += payout;
        save.updatedAtMs = nowMs();
        period.prizePool = 0;
        period.audit.push({
          atMs: nowMs(),
          type: "payout",
          playerId: winnerPlayerId,
          amount: payout,
          detail: "stub wallet credit",
        });
      }

      return statusFor(playerId);
    },
  };
}

export { CHAMPIONSHIP_ENTRY_PRODUCT_ID };
