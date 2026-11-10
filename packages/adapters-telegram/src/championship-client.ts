import type { AvatarLoadout, PlayerAnswer } from "@mir-games/game-core";

export type ChampionshipStatusDto = {
  periodKey: string;
  open: boolean;
  periodStatus: "open" | "closed" | "settled";
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

export type ChampionshipRunDto = {
  periodKey: string;
  status: "active" | "finished";
  roundIndex: number;
  totalRounds: number;
  deadlineMs: number;
  serverNowMs: number;
  roundThemes: string[];
  currentQuestion: {
    id: string;
    format: "single_choice" | "multi_choice" | "text";
    locationTheme: string;
    domain: string;
    difficulty: string;
    prompt: string;
    mediaId?: string;
    options?: { id: string; label: string }[];
  } | null;
  you: {
    playerId: string;
    displayName?: string;
    avatar: AvatarLoadout;
    score: number;
    answeredCurrentRound: boolean;
  };
  yourLastGraded: {
    questionId: string;
    correct: boolean;
    points: number;
    timedOut: boolean;
  } | null;
};

export type ChampionshipApiClient = {
  status(playerId: string): Promise<ChampionshipStatusDto>;
  enter(
    playerId: string,
    receipt: { provider: string; receiptId: string; productId: string },
  ): Promise<ChampionshipStatusDto>;
  start(playerId: string): Promise<ChampionshipRunDto>;
  getRun(playerId: string): Promise<ChampionshipRunDto>;
  submitAnswer(
    playerId: string,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): Promise<ChampionshipRunDto>;
  settle(playerId: string, periodKey?: string): Promise<ChampionshipStatusDto>;
};

async function parseStatus(res: Response): Promise<ChampionshipStatusDto> {
  const body = (await res.json()) as ChampionshipStatusDto & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Championship API ${res.status}`);
  }
  return body;
}

async function parseRun(res: Response): Promise<ChampionshipRunDto> {
  const body = (await res.json()) as ChampionshipRunDto & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Championship run ${res.status}`);
  }
  return body;
}

/** Thin HTTP client — prize pool / scores stay on bot-server. */
export function createChampionshipApiClient(apiBaseUrl: string): ChampionshipApiClient {
  return {
    async status(playerId) {
      const qs = new URLSearchParams({ playerId });
      const res = await fetch(`${apiBaseUrl}/api/championship/status?${qs}`);
      return parseStatus(res);
    },
    async enter(playerId, receipt) {
      const res = await fetch(`${apiBaseUrl}/api/championship/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...receipt }),
      });
      return parseStatus(res);
    },
    async start(playerId) {
      const res = await fetch(`${apiBaseUrl}/api/championship/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      });
      return parseRun(res);
    },
    async getRun(playerId) {
      const qs = new URLSearchParams({ playerId });
      const res = await fetch(`${apiBaseUrl}/api/championship/run?${qs}`);
      return parseRun(res);
    },
    async submitAnswer(playerId, roundIndex, answer) {
      const res = await fetch(`${apiBaseUrl}/api/championship/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, roundIndex, answer }),
      });
      return parseRun(res);
    },
    async settle(playerId, periodKey) {
      const res = await fetch(`${apiBaseUrl}/api/championship/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, periodKey }),
      });
      return parseStatus(res);
    },
  };
}
