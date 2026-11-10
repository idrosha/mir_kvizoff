import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PARTY_MAX_PLAYERS } from "@mir-games/game-core";
import { createInMemoryProgressStore } from "../progress/store.js";
import { createInMemoryPartyRoomStore } from "./room-store.js";

describe("PartyRoomStore", () => {
  it("creates open and closed rooms; only host sees join code", () => {
    let seq = 0;
    const progress = createInMemoryProgressStore(() => 1);
    const rooms = createInMemoryPartyRoomStore({
      progress,
      nowMs: () => 1,
      randomInt: () => {
        seq += 1;
        return seq % 30;
      },
    });
    progress.getOrCreate("demo:host", "Host");

    const open = rooms.createRoom("demo:host", { visibility: "open", title: "Команда A" });
    assert.equal(open.visibility, "open");
    assert.equal(open.youAreHost, true);
    assert.ok(open.joinCode);
    assert.equal(open.maxPlayers, PARTY_MAX_PLAYERS);

    const listed = rooms.listOpenRooms();
    assert.equal(listed.length, 1);
    assert.equal(listed[0]!.roomId, open.roomId);

    const closed = rooms.createRoom("demo:host", { visibility: "closed" });
    assert.equal(closed.visibility, "closed");
    assert.ok(closed.joinCode);
    assert.equal(rooms.listOpenRooms().length, 1);
  });

  it("lets players join open by id and closed by code; host sees live scores", () => {
    let n = 0;
    const progress = createInMemoryProgressStore(() => 1000);
    const rooms = createInMemoryPartyRoomStore({
      progress,
      nowMs: () => 1000,
      randomInt: () => {
        n += 1;
        return n % 28;
      },
    });
    progress.getOrCreate("demo:host", "Host");
    progress.getOrCreate("demo:p1", "P1");
    progress.getOrCreate("demo:p2", "P2");

    const room = rooms.createRoom("demo:host", { visibility: "closed" });
    assert.throws(() => rooms.joinRoom("demo:p1", { roomId: room.roomId }));

    const joined = rooms.joinRoom("demo:p1", { code: room.joinCode! });
    assert.equal(joined.playerCount, 1);
    assert.equal(joined.youAreHost, false);
    assert.equal(joined.joinCode, null);

    rooms.joinRoom("demo:p2", { code: room.joinCode! });
    const started = rooms.startRoom("demo:host", room.roomId);
    assert.equal(started.status, "playing");
    assert.equal(started.currentQuestion?.format, "single_choice");

    const after = rooms.submitAnswer("demo:p1", room.roomId, 0, {
      format: "single_choice",
      optionId: "b",
    });
    assert.equal(after.yourScore, 1);

    const hostView = rooms.getRoom(room.roomId, "demo:host");
    assert.equal(hostView.leaderboard[0]!.playerId, "demo:p1");
    assert.equal(hostView.leaderboard[0]!.score, 1);
    assert.equal(hostView.leaderboard[1]!.answeredCurrentRound, false);
  });

  it("host advance times out unanswered players and finishes after last round", () => {
    let tick = 0;
    const progress = createInMemoryProgressStore(() => 1);
    const rooms = createInMemoryPartyRoomStore({
      progress,
      nowMs: () => 1,
      randomInt: () => {
        tick += 1;
        return tick % 20;
      },
    });
    progress.getOrCreate("demo:host");
    progress.getOrCreate("demo:p");
    const room = rooms.createRoom("demo:host", { visibility: "open" });
    rooms.joinRoom("demo:p", { roomId: room.roomId });
    rooms.startRoom("demo:host", room.roomId);

    rooms.submitAnswer("demo:p", room.roomId, 0, {
      format: "single_choice",
      optionId: "b",
    });
    let view = rooms.advanceRound("demo:host", room.roomId);
    assert.equal(view.roundIndex, 1);

    // Skip answering round 1 — host advances → timeout 0 points
    view = rooms.advanceRound("demo:host", room.roomId);
    assert.equal(view.roundIndex, 2);
    assert.equal(view.leaderboard[0]!.score, 1);

    view = rooms.submitAnswer("demo:p", room.roomId, 2, {
      format: "text",
      text: "Amelie",
    });
    // Last-round answers auto-finish; host advance stays idempotent.
    assert.equal(view.status, "finished");
    view = rooms.advanceRound("demo:host", room.roomId);
    assert.equal(view.status, "finished");
    assert.equal(view.leaderboard[0]!.score, 2);
  });

  it("rejects joining a full room", () => {
    let i = 0;
    const progress = createInMemoryProgressStore(() => 1);
    const rooms = createInMemoryPartyRoomStore({
      progress,
      nowMs: () => 1,
      randomInt: () => {
        i += 1;
        return i % 25;
      },
    });
    progress.getOrCreate("demo:host");
    const room = rooms.createRoom("demo:host", { visibility: "open" });
    for (let p = 0; p < PARTY_MAX_PLAYERS; p += 1) {
      const id = `demo:fill-${p}`;
      progress.getOrCreate(id);
      rooms.joinRoom(id, { roomId: room.roomId });
    }
    progress.getOrCreate("demo:extra");
    assert.throws(() => rooms.joinRoom("demo:extra", { roomId: room.roomId }));
  });
});
