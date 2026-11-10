import type { PlayerAnswer } from "@mir-games/game-core";

export type PartyPlayerPublicDto = {
  playerId: string;
  displayName?: string;
  avatar: import("@mir-games/game-core").AvatarLoadout;
  score: number;
  answeredCurrentRound: boolean;
  answersCount: number;
};

export type PartyRoomPublicDto = {
  roomId: string;
  title: string;
  visibility: "open" | "closed";
  joinCode: string | null;
  status: "lobby" | "playing" | "finished";
  hostId: string;
  hostDisplayName?: string;
  youAreHost: boolean;
  maxPlayers: number;
  playerCount: number;
  players: PartyPlayerPublicDto[];
  roundIndex: number;
  totalRounds: number;
  deadlineMs: number | null;
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
  yourScore: number;
  yourAnsweredCurrentRound: boolean;
  leaderboard: PartyPlayerPublicDto[];
};

export type PartyRoomSummaryDto = {
  roomId: string;
  title: string;
  hostDisplayName?: string;
  playerCount: number;
  maxPlayers: number;
  status: "lobby" | "playing" | "finished";
};

export type PartyApiClient = {
  create(
    playerId: string,
    options: { visibility: "open" | "closed"; title?: string },
  ): Promise<PartyRoomPublicDto>;
  listOpen(): Promise<PartyRoomSummaryDto[]>;
  join(
    playerId: string,
    options: { roomId?: string; code?: string },
  ): Promise<PartyRoomPublicDto>;
  leave(playerId: string, roomId: string): Promise<void>;
  getRoom(roomId: string, playerId: string): Promise<PartyRoomPublicDto>;
  start(playerId: string, roomId: string): Promise<PartyRoomPublicDto>;
  advance(playerId: string, roomId: string): Promise<PartyRoomPublicDto>;
  submitAnswer(
    playerId: string,
    roomId: string,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): Promise<PartyRoomPublicDto>;
};

async function parseRoom(res: Response): Promise<PartyRoomPublicDto> {
  const body = (await res.json()) as PartyRoomPublicDto & { error?: string };
  if (!res.ok) {
    throw new Error(body.error ?? `Party API ${res.status}`);
  }
  return body;
}

/** Thin HTTP client for company party rooms — scoring stays on bot-server. */
export function createPartyApiClient(apiBaseUrl: string): PartyApiClient {
  return {
    async create(playerId, options) {
      const res = await fetch(`${apiBaseUrl}/api/party/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...options }),
      });
      return parseRoom(res);
    },
    async listOpen() {
      const res = await fetch(`${apiBaseUrl}/api/party/open`);
      const body = (await res.json()) as { rooms?: PartyRoomSummaryDto[]; error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Party open list ${res.status}`);
      }
      return body.rooms ?? [];
    },
    async join(playerId, options) {
      const res = await fetch(`${apiBaseUrl}/api/party/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, ...options }),
      });
      return parseRoom(res);
    },
    async leave(playerId, roomId) {
      const res = await fetch(`${apiBaseUrl}/api/party/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, roomId }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? `Party leave ${res.status}`);
      }
    },
    async getRoom(roomId, playerId) {
      const qs = new URLSearchParams({ roomId, playerId });
      const res = await fetch(`${apiBaseUrl}/api/party/room?${qs}`);
      return parseRoom(res);
    },
    async start(playerId, roomId) {
      const res = await fetch(`${apiBaseUrl}/api/party/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, roomId }),
      });
      return parseRoom(res);
    },
    async advance(playerId, roomId) {
      const res = await fetch(`${apiBaseUrl}/api/party/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, roomId }),
      });
      return parseRoom(res);
    },
    async submitAnswer(playerId, roomId, roundIndex, answer) {
      const res = await fetch(`${apiBaseUrl}/api/party/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, roomId, roundIndex, answer }),
      });
      return parseRoom(res);
    },
  };
}
