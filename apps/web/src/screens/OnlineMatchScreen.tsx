import { useEffect, useReducer, useState } from "react";
import type { OnlineApiClient, OnlineMatchPublicDto } from "@mir-games/adapters-web";
import type { PlayerAnswer } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";
import { TimerBar } from "../components/TimerBar";

type Props = {
  playerId: string;
  onlineApi: OnlineApiClient;
  initialMatch: OnlineMatchPublicDto;
  onFinished: (match: OnlineMatchPublicDto) => void;
};

export function OnlineMatchScreen({
  playerId,
  onlineApi,
  initialMatch,
  onFinished,
}: Props) {
  const [match, setMatch] = useState(initialMatch);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);

  const remainingMs = Math.max(0, match.deadlineMs - Date.now());
  const question = match.currentQuestion;
  const theme = match.roundThemes[match.roundIndex] ?? "online";

  useEffect(() => {
    const id = window.setInterval(() => {
      tick();
      if (match.status === "finished") {
        return;
      }
      if (Date.now() > match.deadlineMs && !match.you.answeredCurrentRound && !submitting) {
        void submit(null);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit closes over latest match
  }, [match, submitting]);

  useEffect(() => {
    setMultiPick([]);
    setTextValue("");
  }, [match.roundIndex]);

  async function submit(answer: PlayerAnswer | null): Promise<void> {
    if (submitting || match.status === "finished" || match.you.answeredCurrentRound) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const next = await onlineApi.submitAnswer(
        playerId,
        match.matchId,
        match.roundIndex,
        answer,
      );
      setMatch(next);
      if (next.status === "finished") {
        onFinished(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (match.status === "finished" || !question) {
    return (
      <section className="screen play-screen">
        <p>Подсчёт результата на сервере…</p>
      </section>
    );
  }

  return (
    <section className="screen play-screen online-match" key={`${match.matchId}:${match.roundIndex}`}>
      <header className="play-hud online-hud">
        <div className="play-hud-text">
          <p className="brand">Мир Квизов · Онлайн</p>
          <p className="play-meta">
            Раунд {match.roundIndex + 1}/{match.totalRounds} · {theme}
          </p>
          <p className="online-scoreline">
            Вы {match.you.score} : {match.opponent.score}{" "}
            {match.opponent.displayName ?? "Соперник"}
          </p>
          <TimerBar remainingMs={remainingMs} />
        </div>
        <div className="online-avatar-row">
          <AvatarView loadout={match.you.avatar} size="sm" label="Вы" />
          <AvatarView
            loadout={match.opponent.avatar}
            size="sm"
            label={match.opponent.displayName ?? "Соперник"}
          />
        </div>
      </header>

      <div className="question-panel">
        <p className="domain">
          {question.domain} · {question.difficulty}
          {question.format === "text" ? " · ввод текста" : ""}
        </p>
        <h1 className="prompt">{question.prompt}</h1>

        {question.format === "single_choice" && question.options ? (
          <div className="options" role="listbox" aria-label="Варианты">
            {question.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="option"
                disabled={submitting}
                onClick={() => void submit({ format: "single_choice", optionId: opt.id })}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}

        {question.format === "multi_choice" && question.options ? (
          <div className="options multi">
            <p className="hint">Может быть несколько верных ответов</p>
            {question.options.map((opt) => {
              const on = multiPick.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`option ${on ? "is-selected" : ""}`}
                  aria-pressed={on}
                  disabled={submitting}
                  onClick={() =>
                    setMultiPick((prev) =>
                      prev.includes(opt.id)
                        ? prev.filter((x) => x !== opt.id)
                        : [...prev, opt.id],
                    )
                  }
                >
                  {opt.label}
                </button>
              );
            })}
            <button
              type="button"
              className="btn"
              disabled={submitting || multiPick.length === 0}
              onClick={() =>
                void submit({ format: "multi_choice", optionIds: [...multiPick] })
              }
            >
              Ответить
            </button>
          </div>
        ) : null}

        {question.format === "text" ? (
          <form
            className="text-answer"
            onSubmit={(e) => {
              e.preventDefault();
              void submit({ format: "text", text: textValue });
            }}
          >
            <label className="text-answer-label" htmlFor="online-text-answer">
              Ваш ответ
            </label>
            <input
              id="online-text-answer"
              className="text-answer-input"
              type="text"
              autoComplete="off"
              value={textValue}
              disabled={submitting}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Введите ответ…"
            />
            <button
              type="submit"
              className="btn"
              disabled={submitting || textValue.trim().length === 0}
            >
              Отправить
            </button>
          </form>
        ) : null}

        {error ? <p className="error-banner">{error}</p> : null}
        {match.yourLastGraded && match.you.answeredCurrentRound ? (
          <p className="online-feedback">
            {match.yourLastGraded.timedOut
              ? "Время вышло"
              : match.yourLastGraded.correct
                ? "Верно (+1)"
                : "Неверно"}
          </p>
        ) : null}
      </div>
    </section>
  );
}
