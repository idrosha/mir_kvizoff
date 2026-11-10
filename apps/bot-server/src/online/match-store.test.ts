import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInMemoryProgressStore } from "../progress/store.js";
import { createInMemoryMatchStore, STUB_OPPONENT_ID } from "./match-store.js";

describe("MatchStore online MVP", () => {
  it("stub-bot matchmaking creates an active match with avatar + three round themes", () => {
    let now = 1_000;
    const progress = createInMemoryProgressStore(() => now);
    const matches = createInMemoryMatchStore({
      progress,
      nowMs: () => now,
    });
    progress.getOrCreate("demo:p1", "P1");
    progress.buyItem("demo:p1", "hat-fez", "money");
    progress.equipItem("demo:p1", "hat-fez");

    const joined = matches.joinQueue("demo:p1", { mode: "stub-bot" });
    assert.equal(joined.status, "matched");
    assert.ok(joined.match);
    assert.equal(joined.match!.status, "active");
    assert.equal(joined.match!.totalRounds, 3);
    assert.deepEqual(joined.match!.roundThemes, [
      "egypt-history",
      "rome-food",
      "paris-cinema",
    ]);
    assert.equal(joined.match!.opponent.playerId, STUB_OPPONENT_ID);
    assert.equal(joined.match!.you.avatar.equipped.hat, "hat-fez");
    assert.equal(joined.match!.currentQuestion?.format, "single_choice");
    assert.equal("correctOptionId" in (joined.match!.currentQuestion ?? {}), false);
  });

  it("grades free-text only on the server and updates rating after finish", () => {
    let now = 1_000;
    const progress = createInMemoryProgressStore(() => now);
    const matches = createInMemoryMatchStore({
      progress,
      nowMs: () => now,
    });
    progress.getOrCreate("demo:p2", "P2");

    const { match } = matches.joinQueue("demo:p2");
    assert.ok(match);
    const matchId = match.matchId;

    // Round 0 — correct single
    let view = matches.submitAnswer("demo:p2", matchId, 0, {
      format: "single_choice",
      optionId: "b",
    });
    assert.equal(view.yourLastGraded?.correct, true);
    assert.equal(view.roundIndex, 1);
    assert.equal(view.currentQuestion?.format, "multi_choice");
    assert.equal("correctOptionIds" in (view.currentQuestion ?? {}), false);

    now += 100;
    // Round 1 — correct multi
    view = matches.submitAnswer("demo:p2", matchId, 1, {
      format: "multi_choice",
      optionIds: ["a", "c", "d"],
    });
    assert.equal(view.yourLastGraded?.correct, true);
    assert.equal(view.roundIndex, 2);
    assert.equal(view.currentQuestion?.format, "text");
    assert.equal("acceptedAnswers" in (view.currentQuestion ?? {}), false);

    now += 100;
    // Round 2 — free-text (server normalization)
    view = matches.submitAnswer("demo:p2", matchId, 2, {
      format: "text",
      text: "  amelie ",
    });
    assert.equal(view.status, "finished");
    assert.equal(view.yourLastGraded?.correct, true);
    assert.equal(view.you.score, 3);
    // Stub bot: correct, wrong, correct → score 2
    assert.equal(view.opponent.score, 2);
    assert.equal(view.ratingDelta, 10);
    assert.equal(progress.getOnlineRating("demo:p2"), 1010);
  });

  it("times out late answers using server deadline", () => {
    let now = 1_000;
    const progress = createInMemoryProgressStore(() => now);
    const matches = createInMemoryMatchStore({
      progress,
      nowMs: () => now,
    });
    progress.getOrCreate("demo:late");
    const { match } = matches.joinQueue("demo:late");
    assert.ok(match);
    now = match.deadlineMs + 1;
    const view = matches.submitAnswer("demo:late", match.matchId, 0, {
      format: "single_choice",
      optionId: "b",
    });
    assert.equal(view.yourLastGraded?.timedOut, true);
    assert.equal(view.yourLastGraded?.points, 0);
  });

  it("queue-human leaves a player waiting until a second joins", () => {
    const progress = createInMemoryProgressStore(() => 1);
    const matches = createInMemoryMatchStore({ progress, nowMs: () => 1 });
    progress.getOrCreate("demo:a");
    progress.getOrCreate("demo:b");

    const first = matches.joinQueue("demo:a", { mode: "queue-human" });
    assert.equal(first.status, "queued");
    assert.equal(first.match, null);

    const second = matches.joinQueue("demo:b", { mode: "queue-human" });
    assert.equal(second.status, "matched");
    assert.ok(second.match);
    assert.equal(second.match!.opponent.isStubOpponent, false);
    assert.equal(second.match!.you.playerId, "demo:b");
  });

  it("rejects client-claimed score by never accepting score in submitAnswer", () => {
    const progress = createInMemoryProgressStore(() => 1_000);
    const matches = createInMemoryMatchStore({
      progress,
      nowMs: () => 1_000,
    });
    progress.getOrCreate("demo:cheat");
    const { match } = matches.joinQueue("demo:cheat");
    assert.ok(match);
    const view = matches.submitAnswer("demo:cheat", match.matchId, 0, {
      format: "single_choice",
      optionId: "a", // wrong
    });
    assert.equal(view.you.score, 0);
    assert.equal(view.yourLastGraded?.correct, false);
  });
});
