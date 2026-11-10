/** Party / company room rules — server authoritative; clients never set scores. */

/** Max answering players in a party room (host/ведущий is a separate role). */
export const PARTY_MAX_PLAYERS = 30;

/** Invite code length for closed (and optional open) rooms. */
export const PARTY_JOIN_CODE_LENGTH = 6;

export type PartyRoomVisibility = "open" | "closed";

export type PartyRoomStatus = "lobby" | "playing" | "finished";

export type PartyRoomRole = "host" | "player";

export function assertPartyCapacity(playerCount: number): void {
  if (playerCount < 0) {
    throw new Error("playerCount must be >= 0");
  }
  if (playerCount > PARTY_MAX_PLAYERS) {
    throw new Error(`Party room supports at most ${PARTY_MAX_PLAYERS} players`);
  }
}

export function canJoinPartyRoom(options: {
  status: PartyRoomStatus;
  playerCount: number;
  alreadyInRoom: boolean;
}): boolean {
  if (options.alreadyInRoom) {
    return true;
  }
  if (options.status !== "lobby") {
    return false;
  }
  return options.playerCount < PARTY_MAX_PLAYERS;
}

/** Alphabet without ambiguous 0/O/1/I for human invite codes. */
const PARTY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizePartyJoinCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidPartyJoinCode(code: string): boolean {
  const normalized = normalizePartyJoinCode(code);
  return (
    normalized.length === PARTY_JOIN_CODE_LENGTH &&
    [...normalized].every((ch) => PARTY_CODE_ALPHABET.includes(ch))
  );
}

/**
 * Generate a join code. `randomInt` must return an integer in [0, maxExclusive).
 * Kept in game-core so both server and tests share the same alphabet/rules.
 */
export function generatePartyJoinCode(randomInt: (maxExclusive: number) => number): string {
  let out = "";
  for (let i = 0; i < PARTY_JOIN_CODE_LENGTH; i += 1) {
    const idx = randomInt(PARTY_CODE_ALPHABET.length);
    if (idx < 0 || idx >= PARTY_CODE_ALPHABET.length) {
      throw new Error("randomInt out of range");
    }
    out += PARTY_CODE_ALPHABET[idx]!;
  }
  return out;
}

export function sortPartyLeaderboard<T extends { score: number; displayName?: string; playerId: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const an = (a.displayName ?? a.playerId).toLowerCase();
    const bn = (b.displayName ?? b.playerId).toLowerCase();
    if (an < bn) return -1;
    if (an > bn) return 1;
    return a.playerId.localeCompare(b.playerId);
  });
}
