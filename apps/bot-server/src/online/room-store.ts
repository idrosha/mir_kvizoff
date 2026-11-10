import {
  ONLINE_ROUNDS_PER_MATCH,
  PARTY_MAX_PLAYERS,
  canJoinPartyRoom,
  generatePartyJoinCode,
  gradeOnlineAnswer,
  isValidPartyJoinCode,
  nextRoundDeadlineMs,
  normalizePartyJoinCode,
  sortPartyLeaderboard,
  toPublicQuestion,
  type AvatarLoadout,
  type GradedAnswer,
  type OnlineMatchDefinition,
  type PartyRoomStatus,
  type PartyRoomVisibility,
  type PlayerAnswer,
  type PublicQuestion,
} from "@mir-games/game-core";
import type { ProgressStore } from "../progress/store.js";
import { createOnlineMatchBank } from "./bank.js";

export type PartyPlayerPublic = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  score: number;
  answeredCurrentRound: boolean;
  answersCount: number;
};

export type PartyRoomPublic = {
  roomId: string;
  title: string;
  visibility: PartyRoomVisibility;
  /** Invite code is only returned to the host (ведущий). */
  joinCode: string | null;
  status: PartyRoomStatus;
  hostId: string;
  hostDisplayName?: string;
  youAreHost: boolean;
  maxPlayers: number;
  playerCount: number;
  players: PartyPlayerPublic[];
  roundIndex: number;
  totalRounds: number;
  deadlineMs: number | null;
  serverNowMs: number;
  roundThemes: string[];
  currentQuestion: PublicQuestion | null;
  yourScore: number;
  yourAnsweredCurrentRound: boolean;
  leaderboard: PartyPlayerPublic[];
};

export type PartyRoomSummary = {
  roomId: string;
  title: string;
  hostDisplayName?: string;
  playerCount: number;
  maxPlayers: number;
  status: PartyRoomStatus;
};

type Seat = {
  playerId: string;
  displayName?: string;
  avatar: AvatarLoadout;
  answers: GradedAnswer[];
  score: number;
  answeredRounds: Set<number>;
};

type RoomRecord = {
  roomId: string;
  title: string;
  visibility: PartyRoomVisibility;
  joinCode: string;
  status: PartyRoomStatus;
  hostId: string;
  seats: Map<string, Seat>;
  definition: OnlineMatchDefinition | null;
  roundIndex: number;
  deadlineMs: number | null;
  createdAtMs: number;
  finishedAtMs?: number;
};

export type PartyRoomStore = {
  createRoom(
    hostId: string,
    options: { visibility: PartyRoomVisibility; title?: string },
  ): PartyRoomPublic;
  listOpenRooms(): PartyRoomSummary[];
  joinRoom(
    playerId: string,
    options: { roomId?: string; code?: string },
  ): PartyRoomPublic;
  leaveRoom(playerId: string, roomId: string): { ok: true };
  getRoom(roomId: string, viewerPlayerId: string): PartyRoomPublic;
  startRoom(hostId: string, roomId: string): PartyRoomPublic;
  advanceRound(hostId: string, roomId: string): PartyRoomPublic;
  submitAnswer(
    playerId: string,
    roomId: string,
    roundIndex: number,
    answer: PlayerAnswer | null,
  ): PartyRoomPublic;
};

function makeSeat(progress: ProgressStore, playerId: string): Seat {
  const save = progress.getOrCreate(playerId);
  return {
    playerId,
    displayName: save.displayName,
    avatar: { equipped: { ...save.avatar.equipped } },
    answers: [],
    score: 0,
    answeredRounds: new Set(),
  };
}

function seatPublic(seat: Seat, roundIndex: number, status: PartyRoomStatus): PartyPlayerPublic {
  return {
    playerId: seat.playerId,
    displayName: seat.displayName,
    avatar: seat.avatar,
    score: seat.score,
    answeredCurrentRound: seat.answeredRounds.has(roundIndex) || status === "finished",
    answersCount: seat.answers.length,
  };
}

export function createInMemoryPartyRoomStore(options: {
  progress: ProgressStore;
  nowMs?: () => number;
  createDefinition?: () => OnlineMatchDefinition;
  randomInt?: (maxExclusive: number) => number;
}): PartyRoomStore {
  const nowMs = options.nowMs ?? (() => Date.now());
  const createDefinition = options.createDefinition ?? createOnlineMatchBank;
  const randomInt =
    options.randomInt ??
    ((maxExclusive: number) => Math.floor(Math.random() * maxExclusive));

  const rooms = new Map<string, RoomRecord>();
  const codeIndex = new Map<string, string>();
  let roomSeq = 0;

  function uniqueCode(): string {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const code = generatePartyJoinCode(randomInt);
      if (!codeIndex.has(code)) {
        return code;
      }
    }
    throw new Error("Could not allocate unique party join code");
  }

  function requireRoom(roomId: string): RoomRecord {
    const room = rooms.get(roomId);
    if (!room) {
      throw new Error("Room not found");
    }
    return room;
  }

  function toPublic(room: RoomRecord, viewerPlayerId: string): PartyRoomPublic {
    const youAreHost = room.hostId === viewerPlayerId;
    const hostSave = options.progress.getOrCreate(room.hostId);
    const players = [...room.seats.values()].map((s) =>
      seatPublic(s, room.roundIndex, room.status),
    );
    const leaderboard = sortPartyLeaderboard(players);
    const you = room.seats.get(viewerPlayerId);
    const finished = room.status === "finished";
    const round =
      room.definition && room.status === "playing"
        ? room.definition.rounds[room.roundIndex]
        : undefined;
    const showQuestion = room.status === "playing" && Boolean(round);

    return {
      roomId: room.roomId,
      title: room.title,
      visibility: room.visibility,
      joinCode: youAreHost ? room.joinCode : null,
      status: room.status,
      hostId: room.hostId,
      hostDisplayName: hostSave.displayName,
      youAreHost,
      maxPlayers: PARTY_MAX_PLAYERS,
      playerCount: room.seats.size,
      players,
      roundIndex: room.roundIndex,
      totalRounds: ONLINE_ROUNDS_PER_MATCH,
      deadlineMs: room.deadlineMs,
      serverNowMs: nowMs(),
      roundThemes: room.definition?.rounds.map((r) => r.theme) ?? [],
      currentQuestion: showQuestion && round ? toPublicQuestion(round.question) : null,
      yourScore: you?.score ?? 0,
      yourAnsweredCurrentRound: you
        ? you.answeredRounds.has(room.roundIndex) || finished
        : false,
      leaderboard,
    };
  }

  function maybeAutoFinish(room: RoomRecord): void {
    if (room.status !== "playing" || !room.definition) {
      return;
    }
    if (room.seats.size === 0) {
      return;
    }
    const allDone = [...room.seats.values()].every(
      (s) => s.answers.length >= ONLINE_ROUNDS_PER_MATCH,
    );
    if (allDone) {
      room.status = "finished";
      room.finishedAtMs = nowMs();
      room.deadlineMs = null;
    }
  }

  return {
    createRoom(hostId, opts) {
      options.progress.getOrCreate(hostId);
      if (opts.visibility !== "open" && opts.visibility !== "closed") {
        throw new Error("visibility must be open or closed");
      }
      roomSeq += 1;
      const now = nowMs();
      const joinCode = uniqueCode();
      const title =
        (opts.title ?? "").trim().slice(0, 60) ||
        (opts.visibility === "open" ? "Открытая комната" : "Закрытая комната");
      const room: RoomRecord = {
        roomId: `party-${roomSeq}-${now.toString(36)}`,
        title,
        visibility: opts.visibility,
        joinCode,
        status: "lobby",
        hostId,
        seats: new Map(),
        definition: null,
        roundIndex: 0,
        deadlineMs: null,
        createdAtMs: now,
      };
      rooms.set(room.roomId, room);
      codeIndex.set(joinCode, room.roomId);
      return toPublic(room, hostId);
    },

    listOpenRooms() {
      const out: PartyRoomSummary[] = [];
      for (const room of rooms.values()) {
        if (room.visibility !== "open" || room.status !== "lobby") {
          continue;
        }
        const hostSave = options.progress.getOrCreate(room.hostId);
        out.push({
          roomId: room.roomId,
          title: room.title,
          hostDisplayName: hostSave.displayName,
          playerCount: room.seats.size,
          maxPlayers: PARTY_MAX_PLAYERS,
          status: room.status,
        });
      }
      return out.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    },

    joinRoom(playerId, opts) {
      options.progress.getOrCreate(playerId);
      let room: RoomRecord;
      if (opts.code) {
        const code = normalizePartyJoinCode(opts.code);
        if (!isValidPartyJoinCode(code)) {
          throw new Error("Invalid join code");
        }
        const roomId = codeIndex.get(code);
        if (!roomId) {
          throw new Error("Room not found for code");
        }
        room = requireRoom(roomId);
      } else if (opts.roomId) {
        room = requireRoom(opts.roomId);
        if (room.visibility === "closed") {
          throw new Error("Closed room requires join code");
        }
      } else {
        throw new Error("roomId or code required");
      }

      if (room.hostId === playerId) {
        return toPublic(room, playerId);
      }

      const already = room.seats.has(playerId);
      if (
        !canJoinPartyRoom({
          status: room.status,
          playerCount: room.seats.size,
          alreadyInRoom: already,
        })
      ) {
        if (room.status !== "lobby") {
          throw new Error("Room is not accepting players");
        }
        throw new Error(`Room is full (max ${PARTY_MAX_PLAYERS})`);
      }

      if (!already) {
        room.seats.set(playerId, makeSeat(options.progress, playerId));
      }
      return toPublic(room, playerId);
    },

    leaveRoom(playerId, roomId) {
      const room = requireRoom(roomId);
      if (room.hostId === playerId) {
        if (room.status === "playing") {
          throw new Error("Host cannot leave during an active game");
        }
        rooms.delete(room.roomId);
        codeIndex.delete(room.joinCode);
        return { ok: true };
      }
      if (!room.seats.has(playerId)) {
        throw new Error("Player is not in this room");
      }
      room.seats.delete(playerId);
      return { ok: true };
    },

    getRoom(roomId, viewerPlayerId) {
      const room = requireRoom(roomId);
      if (room.hostId !== viewerPlayerId && !room.seats.has(viewerPlayerId)) {
        throw new Error("Player is not in this room");
      }
      return toPublic(room, viewerPlayerId);
    },

    startRoom(hostId, roomId) {
      const room = requireRoom(roomId);
      if (room.hostId !== hostId) {
        throw new Error("Only host can start the room");
      }
      if (room.status !== "lobby") {
        throw new Error("Room already started");
      }
      if (room.seats.size < 1) {
        throw new Error("Need at least one player to start");
      }
      room.definition = createDefinition();
      room.status = "playing";
      room.roundIndex = 0;
      room.deadlineMs = nextRoundDeadlineMs(nowMs());
      return toPublic(room, hostId);
    },

    advanceRound(hostId, roomId) {
      const room = requireRoom(roomId);
      if (room.hostId !== hostId) {
        throw new Error("Only host can advance rounds");
      }
      if (room.status === "finished") {
        return toPublic(room, hostId);
      }
      if (room.status !== "playing" || !room.definition) {
        throw new Error("Room is not playing");
      }

      for (const seat of room.seats.values()) {
        if (!seat.answeredRounds.has(room.roundIndex)) {
          const round = room.definition.rounds[room.roundIndex];
          if (!round) {
            throw new Error("Invalid roundIndex");
          }
          const graded = gradeOnlineAnswer({
            question: round.question,
            answer: null,
            nowMs: nowMs(),
            deadlineMs: room.deadlineMs ?? nowMs() - 1,
          });
          seat.answers.push(graded);
          seat.score += graded.points;
          seat.answeredRounds.add(room.roundIndex);
        }
      }

      if (room.roundIndex + 1 >= ONLINE_ROUNDS_PER_MATCH) {
        room.status = "finished";
        room.finishedAtMs = nowMs();
        room.deadlineMs = null;
        return toPublic(room, hostId);
      }

      room.roundIndex += 1;
      room.deadlineMs = nextRoundDeadlineMs(nowMs());
      return toPublic(room, hostId);
    },

    submitAnswer(playerId, roomId, roundIndex, answer) {
      const room = requireRoom(roomId);
      if (room.hostId === playerId) {
        throw new Error("Host (ведущий) does not submit answers");
      }
      const seat = room.seats.get(playerId);
      if (!seat) {
        throw new Error("Player is not in this room");
      }
      if (room.status !== "playing" || !room.definition) {
        throw new Error("Room is not playing");
      }
      if (roundIndex !== room.roundIndex) {
        throw new Error("roundIndex does not match active round");
      }
      if (seat.answeredRounds.has(roundIndex)) {
        throw new Error("Already answered this round");
      }
      const round = room.definition.rounds[roundIndex];
      if (!round) {
        throw new Error("Invalid roundIndex");
      }
      const graded = gradeOnlineAnswer({
        question: round.question,
        answer,
        nowMs: nowMs(),
        deadlineMs: room.deadlineMs ?? nowMs() + 1,
      });
      seat.answers.push(graded);
      seat.score += graded.points;
      seat.answeredRounds.add(roundIndex);
      maybeAutoFinish(room);
      return toPublic(room, playerId);
    },
  };
}
