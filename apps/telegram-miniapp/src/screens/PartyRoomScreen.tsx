import { useEffect, useReducer, useState } from "react";
import type { PartyApiClient, PartyRoomPublicDto } from "@mir-games/adapters-telegram";
import type { PlayerAnswer } from "@mir-games/game-core";
import { TimerBar } from "../components/TimerBar";

type Props = {
  playerId: string;
  partyApi: PartyApiClient;
  initialRoom: PartyRoomPublicDto;
  onLeft: () => void;
  onFinished: (room: PartyRoomPublicDto) => void;
};

export function PartyRoomScreen({
  playerId,
  partyApi,
  initialRoom,
  onLeft,
  onFinished,
}: Props) {
  const [room, setRoom] = useState(initialRoom);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, tick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => {
      void partyApi
        .getRoom(room.roomId, playerId)
        .then((next) => {
          setRoom(next);
          if (next.status === "finished") {
            onFinished(next);
          }
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : String(err));
        });
      tick();
    }, 1000);
    return () => window.clearInterval(id);
  }, [onFinished, partyApi, playerId, room.roomId]);

  useEffect(() => {
    setMultiPick([]);
    setTextValue("");
  }, [room.roundIndex]);

  useEffect(() => {
    if (room.youAreHost || room.status !== "playing") {
      return;
    }
    if (room.yourAnsweredCurrentRound || submitting) {
      return;
    }
    if (room.deadlineMs && Date.now() > room.deadlineMs) {
      void submit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, submitting]);

  async function leave(): Promise<void> {
    setBusy(true);
    try {
      await partyApi.leave(playerId, room.roomId);
      onLeft();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function start(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      setRoom(await partyApi.start(playerId, room.roomId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function advance(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await partyApi.advance(playerId, room.roomId);
      setRoom(next);
      if (next.status === "finished") {
        onFinished(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function submit(answer: PlayerAnswer | null): Promise<void> {
    if (submitting || room.youAreHost || room.yourAnsweredCurrentRound) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const next = await partyApi.submitAnswer(
        playerId,
        room.roomId,
        room.roundIndex,
        answer,
      );
      setRoom(next);
      if (next.status === "finished") {
        onFinished(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const remainingMs =
    room.deadlineMs != null ? Math.max(0, room.deadlineMs - Date.now()) : 0;
  const answeredCount = room.players.filter((p) => p.answeredCurrentRound).length;

  return (
    <section className="screen">
      <button type="button" className="link-back" onClick={() => void leave()} disabled={busy}>
        ← Выйти
      </button>
      <h1>{room.title}</h1>
      <p className="subtitle">
        {room.visibility === "open" ? "Открытая" : "Закрытая"} ·{" "}
        {room.youAreHost ? "Вы ведущий" : "Игрок"} · {room.playerCount}/{room.maxPlayers}
      </p>
      {room.youAreHost && room.joinCode ? (
        <p>
          Код приглашения: <strong>{room.joinCode}</strong>
        </p>
      ) : null}

      {room.status === "lobby" ? (
        <>
          <h2>Лобби</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {room.players.length === 0 ? (
              <li className="subtitle">Ждём игроков…</li>
            ) : (
              room.players.map((p) => (
                <li key={p.playerId}>
                  {p.displayName ?? p.playerId}
                </li>
              ))
            )}
          </ul>
          {room.youAreHost ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={busy || room.playerCount < 1}
              onClick={() => void start()}
            >
              Начать игру
            </button>
          ) : (
            <p className="subtitle">Ожидайте старта от ведущего.</p>
          )}
        </>
      ) : null}

      {room.status === "playing" || room.status === "finished" ? (
        <>
          <h2>
            Раунд {room.roundIndex + 1}/{room.totalRounds}
            {room.status === "finished" ? " · финиш" : ""}
          </h2>
          {room.deadlineMs != null && room.status === "playing" ? (
            <TimerBar remainingMs={remainingMs} />
          ) : null}
          <p className="subtitle">
            Ответили: {answeredCount}/{room.playerCount}
          </p>

          <h3>Живые результаты</h3>
          <ol style={{ paddingLeft: "1.25rem" }}>
            {room.leaderboard.map((p, idx) => (
              <li key={p.playerId}>
                #{idx + 1} {p.displayName ?? p.playerId}: {p.score}
                {p.answeredCurrentRound ? " ✓" : " …"}
              </li>
            ))}
          </ol>

          {room.youAreHost && room.status === "playing" ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={busy}
              onClick={() => void advance()}
            >
              {room.roundIndex + 1 >= room.totalRounds
                ? "Завершить"
                : "Следующий раунд (таймаут неответивших)"}
            </button>
          ) : null}

          {!room.youAreHost && room.status === "playing" && room.currentQuestion ? (
            <div style={{ marginTop: "1rem" }}>
              {room.yourAnsweredCurrentRound ? (
                <p className="subtitle">Ответ принят. Ждите ведущего / остальных.</p>
              ) : (
                <>
                  <p>
                    <strong>{room.currentQuestion.prompt}</strong>
                  </p>
                  {room.currentQuestion.format === "single_choice"
                    ? room.currentQuestion.options?.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className="btn-secondary btn-block"
                          style={{ marginBottom: "0.35rem" }}
                          disabled={submitting}
                          onClick={() =>
                            void submit({ format: "single_choice", optionId: opt.id })
                          }
                        >
                          {opt.label}
                        </button>
                      ))
                    : null}
                  {room.currentQuestion.format === "multi_choice" ? (
                    <>
                      {room.currentQuestion.options?.map((opt) => {
                        const on = multiPick.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={on ? "btn btn-block" : "btn-secondary btn-block"}
                            style={{ marginBottom: "0.35rem" }}
                            onClick={() =>
                              setMultiPick((prev) =>
                                on ? prev.filter((id) => id !== opt.id) : [...prev, opt.id],
                              )
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        className="btn btn-block"
                        disabled={submitting || multiPick.length === 0}
                        onClick={() =>
                          void submit({ format: "multi_choice", optionIds: multiPick })
                        }
                      >
                        Подтвердить
                      </button>
                    </>
                  ) : null}
                  {room.currentQuestion.format === "text" ? (
                    <>
                      <input
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        style={{ display: "block", width: "100%", marginBottom: "0.5rem" }}
                        placeholder="Ответ текстом"
                      />
                      <button
                        type="button"
                        className="btn btn-block"
                        disabled={submitting || !textValue.trim()}
                        onClick={() => void submit({ format: "text", text: textValue })}
                      >
                        Отправить
                      </button>
                    </>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}
