import {
  ONLINE_ROUNDS_PER_MATCH,
  applyOnlineRating,
  computeOnlineRatingDelta,
  gradeOnlineAnswer,
  nextRoundDeadlineMs,
  toPublicQuestion,
  type AvatarLoadout,
  type GradedAnswer,
  type OnlineMatchDefinition,
  type OnlineMatchStatus,
  type PlayerAnswer,
  type PublicQuestion,
} from "@mir-games/game-core";
import type { ProgressStore } from "../progress/store.js";
import { createOnlineMatchBank, stubOpponentAnswerForRound } from "./bank.js";

export const STUB_OPPONENT_ID = "stub:bot-opponent";

export type MatchmakingMode = "stub-bot" | "queue-human";

export type OnlinePlayerPublic = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  rating: number;
  score: number;
  answeredCurrentRound: boolean;
  isStubOpponent: boolean;
};

export type OnlineMatchPublic = {
  matchId: string;
  status: OnlineMatchStatus;
  roundIndex: number;
  totalRounds: number;
  deadlineMs: number;
  serverNowMs: number;
  roundThemes: string[];
  currentQuestion: PublicQuestion | null;
  you: OnlinePlayerPublic;
  opponent: OnlinePlayerPublic;
  yourLastGraded: GradedAnswer | null;
  ratingDelta: number | null;
};

type Seat = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  rating: number;
  answers: GradedAnswer[];
  score: number;
  answeredRounds: Set<number>;
  isStubOpponent: boolean;
  ratingDelta: number | null;
};

type MatchRecord = {
  matchId: string;
  status: "active" | "finished";
  roundIndex: number;
  deadlineMs: number;
  definition: OnlineMatchDefinition;
  seats: [Seat, Seat];
  createdAtMs: number;
  finishedAtMs?: number;
};

export type MatchStore = {
  joinQueue(
    playerId: string,
    options?: { mode?: MatchmakingMode },
  ): { status: "queued" | "matched"; match: OnlineMatchPublic | null };
  getMatch(matchId: string, viewerPlayerId: string): OnlineMatchPublic;
  submitAnswer(
    playerId: string,
    matchId: string,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): OnlineMatchPublic;
  getRating(playerId: string): number;
};

function emptyAvatar(): AvatarLoadout {
  return {
    equipped: {
      shirt: "starter-shirt",
      pants: "starter-pants",
      shoes: "starter-shoes",
    },
  };
}

function seatPublic(seat: Seat, roundIndex: number, matchFinished: boolean): OnlinePlayerPublic {
  return {
    playerId: seat.playerId,
    displayName: seat.displayName,
    avatar: seat.avatar,
    rating: seat.rating,
    score: seat.score,
    answeredCurrentRound: seat.answeredRounds.has(roundIndex) || matchFinished,
    isStubOpponent: seat.isStubOpponent,
  };
}

function toPublic(
  match: MatchRecord,
  viewerPlayerId: string,
  nowMs: number,
): OnlineMatchPublic {
  const youIdx = match.seats.findIndex((s) => s.playerId === viewerPlayerId);
  if (youIdx < 0) {
    throw new Error("Player is not in this match");
  }
  const oppIdx = youIdx === 0 ? 1 : 0;
  const you = match.seats[youIdx]!;
  const opponent = match.seats[oppIdx]!;
  const finished = match.status === "finished";
  const round = match.definition.rounds[match.roundIndex];
  const currentQuestion =
    finished || !round ? null : toPublicQuestion(round.question);
  const yourLast = you.answers.length > 0 ? you.answers[you.answers.length - 1]! : null;

  return {
    matchId: match.matchId,
    status: match.status,
    roundIndex: match.roundIndex,
    totalRounds: ONLINE_ROUNDS_PER_MATCH,
    deadlineMs: match.deadlineMs,
    serverNowMs: nowMs,
    roundThemes: match.definition.rounds.map((r) => r.theme),
    currentQuestion,
    you: seatPublic(you, match.roundIndex, finished),
    opponent: seatPublic(opponent, match.roundIndex, finished),
    yourLastGraded: yourLast,
    ratingDelta: you.ratingDelta,
  };
}

export function createInMemoryMatchStore(options: {
  progress: ProgressStore;
  nowMs?: () => number;
  createDefinition?: () => OnlineMatchDefinition;
}): MatchStore {
  const nowMs = options.nowMs ?? (() => Date.now());
  const createDefinition = options.createDefinition ?? createOnlineMatchBank;
  const matches = new Map<string, MatchRecord>();
  let waitingHumanId: string | null = null;
  let matchSeq = 0;

  function ensurePlayer(playerId: string) {
    return options.progress.getOrCreate(playerId);
  }

  function makeSeat(playerId: string, isStubOpponent: boolean): Seat {
    if (isStubOpponent) {
      return {
        playerId: STUB_OPPONENT_ID,
        displayName: "Соперник (бот)",
        avatar: emptyAvatar(),
        rating: 1000,
        answers: [],
        score: 0,
        answeredRounds: new Set(),
        isStubOpponent: true,
        ratingDelta: null,
      };
    }
    const save = ensurePlayer(playerId);
    return {
      playerId,
      displayName: save.displayName,
      avatar: { equipped: { ...save.avatar.equipped } },
      rating: save.onlineRating,
      answers: [],
      score: 0,
      answeredRounds: new Set(),
      isStubOpponent: false,
      ratingDelta: null,
    };
  }

  function createMatch(aId: string, bId: string, bIsStub: boolean): MatchRecord {
    const now = nowMs();
    matchSeq += 1;
    const match: MatchRecord = {
      matchId: `match-${matchSeq}-${now.toString(36)}`,
      status: "active",
      roundIndex: 0,
      deadlineMs: nextRoundDeadlineMs(now),
      definition: createDefinition(),
      seats: [makeSeat(aId, false), makeSeat(bId, bIsStub)],
      createdAtMs: now,
    };
    matches.set(match.matchId, match);
    return match;
  }

  function finishIfComplete(match: MatchRecord): void {
    if (match.status === "finished") {
      return;
    }
    const bothDone = match.seats.every((s) => s.answers.length >= ONLINE_ROUNDS_PER_MATCH);
    if (!bothDone) {
      return;
    }
    match.status = "finished";
    match.finishedAtMs = nowMs();
    const [a, b] = match.seats;
    const deltaA = computeOnlineRatingDelta(a!.score, b!.score);
    const deltaB = computeOnlineRatingDelta(b!.score, a!.score);
    a!.ratingDelta = deltaA;
    b!.ratingDelta = deltaB;
    if (!a!.isStubOpponent) {
      const next = applyOnlineRating(a!.rating, deltaA);
      options.progress.setOnlineRating(a!.playerId, next);
      a!.rating = next;
    }
    if (!b!.isStubOpponent) {
      const next = applyOnlineRating(b!.rating, deltaB);
      options.progress.setOnlineRating(b!.playerId, next);
      b!.rating = next;
    }
  }

  function gradeSeat(
    match: MatchRecord,
    seat: Seat,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): GradedAnswer {
    if (seat.answeredRounds.has(roundIndex)) {
      throw new Error("Already answered this round");
    }
    if (match.status !== "active") {
      throw new Error("Match is not active");
    }
    if (roundIndex !== match.roundIndex) {
      throw new Error("roundIndex does not match active round");
    }
    const round = match.definition.rounds[roundIndex];
    if (!round) {
      throw new Error("Invalid roundIndex");
    }
    const graded = gradeOnlineAnswer({
      question: round.question,
      answer,
      nowMs: nowMs(),
      deadlineMs: match.deadlineMs,
    });
    seat.answers.push(graded);
    seat.score += graded.points;
    seat.answeredRounds.add(roundIndex);
    return graded;
  }

  function maybeAdvance(match: MatchRecord): void {
    const humansReady = match.seats
      .filter((s) => !s.isStubOpponent)
      .every((s) => s.answeredRounds.has(match.roundIndex));
    if (!humansReady) {
      return;
    }

    for (const seat of match.seats) {
      if (seat.isStubOpponent && !seat.answeredRounds.has(match.roundIndex)) {
        gradeSeat(match, seat, match.roundIndex, stubOpponentAnswerForRound(match.roundIndex));
      }
    }

    if (match.roundIndex + 1 >= ONLINE_ROUNDS_PER_MATCH) {
      finishIfComplete(match);
      return;
    }

    match.roundIndex += 1;
    match.deadlineMs = nextRoundDeadlineMs(nowMs());
  }

  return {
    joinQueue(playerId, opts) {
      ensurePlayer(playerId);
      const mode: MatchmakingMode = opts?.mode ?? "stub-bot";

      if (mode === "stub-bot") {
        const match = createMatch(playerId, STUB_OPPONENT_ID, true);
        return { status: "matched", match: toPublic(match, playerId, nowMs()) };
      }

      if (waitingHumanId && waitingHumanId !== playerId) {
        const other = waitingHumanId;
        waitingHumanId = null;
        const match = createMatch(other, playerId, false);
        return { status: "matched", match: toPublic(match, playerId, nowMs()) };
      }
      waitingHumanId = playerId;
      return { status: "queued", match: null };
    },

    getMatch(matchId, viewerPlayerId) {
      const match = matches.get(matchId);
      if (!match) {
        throw new Error("Match not found");
      }
      return toPublic(match, viewerPlayerId, nowMs());
    },

    submitAnswer(playerId, matchId, roundIndex, answer) {
      const match = matches.get(matchId);
      if (!match) {
        throw new Error("Match not found");
      }
      const seat = match.seats.find((s) => s.playerId === playerId);
      if (!seat || seat.isStubOpponent) {
        throw new Error("Player is not a human seat in this match");
      }
      gradeSeat(match, seat, roundIndex, answer);
      maybeAdvance(match);
      finishIfComplete(match);
      return toPublic(match, playerId, nowMs());
    },

    getRating(playerId) {
      return options.progress.getOnlineRating(playerId);
    },
  };
}
