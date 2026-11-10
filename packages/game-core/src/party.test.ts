import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PARTY_JOIN_CODE_LENGTH,
  PARTY_MAX_PLAYERS,
  assertPartyCapacity,
  canJoinPartyRoom,
  generatePartyJoinCode,
  isValidPartyJoinCode,
  normalizePartyJoinCode,
  sortPartyLeaderboard,
} from "./party.js";

describe("party room rules", () => {
  it("enforces max 30 players", () => {
    assert.equal(PARTY_MAX_PLAYERS, 30);
    assert.doesNotThrow(() => assertPartyCapacity(30));
    assert.throws(() => assertPartyCapacity(31));
  });

  it("allows join only in lobby under capacity", () => {
    assert.equal(
      canJoinPartyRoom({ status: "lobby", playerCount: 0, alreadyInRoom: false }),
      true,
    );
    assert.equal(
      canJoinPartyRoom({ status: "lobby", playerCount: 30, alreadyInRoom: false }),
      false,
    );
    assert.equal(
      canJoinPartyRoom({ status: "playing", playerCount: 1, alreadyInRoom: false }),
      false,
    );
    assert.equal(
      canJoinPartyRoom({ status: "playing", playerCount: 1, alreadyInRoom: true }),
      true,
    );
  });

  it("normalizes and validates join codes", () => {
    assert.equal(normalizePartyJoinCode(" ab-12c "), "AB12C");
    assert.equal(PARTY_JOIN_CODE_LENGTH, 6);
    const code = generatePartyJoinCode(() => 0);
    assert.equal(code.length, 6);
    assert.equal(isValidPartyJoinCode(code), true);
    assert.equal(isValidPartyJoinCode("short"), false);
  });

  it("sorts live results by score then name", () => {
    const ranked = sortPartyLeaderboard([
      { playerId: "b", displayName: "Bob", score: 1 },
      { playerId: "a", displayName: "Ann", score: 2 },
      { playerId: "c", displayName: "Cam", score: 2 },
    ]);
    assert.deepEqual(
      ranked.map((r) => r.playerId),
      ["a", "c", "b"],
    );
  });
});
