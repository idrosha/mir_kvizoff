import type { PlayerAnswer } from "@mir-games/game-core";

/** Mirrors bot-server OnlineMatchPublic — keep in sync with match-store. */
export type OnlineMatchPublicDto = {
  matchId: string;
  status: "queued" | "active" | "finished";
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
    avatar: import("@mir-games/game-core").AvatarLoadout;
    rating: number;
    score: number;
    answeredCurrentRound: boolean;
    isStubOpponent: boolean;
  };
  opponent: {
    playerId: string;
    displayName?: string;
    avatar: import("@mir-games/game-core").AvatarLoadout;
    rating: number;
    score: number;
    answeredCurrentRound: boolean;
    isStubOpponent: boolean;
  };
  yourLastGraded: {
    questionId: string;
    correct: boolean;
    points: number;
    timedOut: boolean;
  } | null;
  ratingDelta: number | null;
};

export type OnlineQueueResponse = {
  status: "queued" | "matched";
  match: OnlineMatchPublicDto | null;
};

export type OnlineApiClient = {
  queue(
    playerId: string,
    mode?: "stub-bot" | "queue-human",
  ): Promise<OnlineQueueResponse>;
  getMatch(matchId: string, playerId: string): Promise<OnlineMatchPublicDto>;
  submitAnswer(
    playerId: string,
    matchId: string,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): Promise<OnlineMatchPublicDto>;
  getRating(playerId: string): Promise<number>;
};

async function parseMatch(res: Response): Promise<OnlineMatchPublicDto> {
  const body = (await res.json()) as OnlineMatchPublicDto & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Online API ${res.status}`);
  }
  return body;
}

/** Thin HTTP client — scoring stays on bot-server. */
export function createOnlineApiClient(apiBaseUrl: string): OnlineApiClient {
  return {
    async queue(playerId, mode = "stub-bot") {
      const res = await fetch(`${apiBaseUrl}/api/online/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, mode }),
      });
      const body = (await res.json()) as OnlineQueueResponse & { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Online queue ${res.status}`);
      }
      return body;
    },
    async getMatch(matchId, playerId) {
      const qs = new URLSearchParams({ matchId, playerId });
      const res = await fetch(`${apiBaseUrl}/api/online/match?${qs}`);
      return parseMatch(res);
    },
    async submitAnswer(playerId, matchId, roundIndex, answer) {
      const res = await fetch(`${apiBaseUrl}/api/online/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, matchId, roundIndex, answer }),
      });
      return parseMatch(res);
    },
    async getRating(playerId) {
      const res = await fetch(
        `${apiBaseUrl}/api/online/rating?playerId=${encodeURIComponent(playerId)}`,
      );
      const body = (await res.json()) as { rating?: number; error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Online rating ${res.status}`);
      }
      return body.rating ?? 0;
    },
  };
}
