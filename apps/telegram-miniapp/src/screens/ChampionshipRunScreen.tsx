import { useEffect, useReducer, useState } from "react";
import type {
  ChampionshipApiClient,
  ChampionshipRunDto,
} from "@mir-games/adapters-telegram";
import type { PlayerAnswer } from "@mir-games/game-core";
import { AvatarView } from "../components/AvatarView";
import { TimerBar } from "../components/TimerBar";

type Props = {
  playerId: string;
  championshipApi: ChampionshipApiClient;
  initialRun: ChampionshipRunDto;
  onFinished: (run: ChampionshipRunDto) => void;
};

export function ChampionshipRunScreen({
  playerId,
  championshipApi,
  initialRun,
  onFinished,
}: Props) {
  const [run, setRun] = useState(initialRun);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, tick] = useReducer((n: number) => n + 1, 0);

  const remainingMs = Math.max(0, run.deadlineMs - Date.now());
  const question = run.currentQuestion;
  const theme = run.roundThemes[run.roundIndex] ?? "championship";

  useEffect(() => {
    const id = window.setInterval(() => {
      tick();
      if (run.status === "finished") {
        return;
      }
      if (Date.now() > run.deadlineMs && !run.you.answeredCurrentRound && !submitting) {
        void submit(null);
      }
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit closes over latest run
  }, [run, submitting]);

  useEffect(() => {
    setMultiPick([]);
    setTextValue("");
  }, [run.roundIndex]);

  async function submit(answer: PlayerAnswer | null): Promise<void> {
    if (submitting || run.status === "finished" || run.you.answeredCurrentRound) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const next = await championshipApi.submitAnswer(playerId, run.roundIndex, answer);
      setRun(next);
      if (next.status === "finished") {
        onFinished(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (run.status === "finished" || !question) {
    return (
      <section className="screen play-screen">
        <p>Подсчёт результата на сервере…</p>
      </section>
    );
  }

  return (
    <section
      className="screen play-screen championship-run"
      key={`champ:${run.roundIndex}:${question.id}`}
    >
      <header className="play-hud online-hud championship-hud">
        <div className="play-hud-text">
          <p className="brand">Мир Квизов · Чемпионат</p>
          <p className="play-meta">
            Раунд {run.roundIndex + 1}/{run.totalRounds} · {theme}
          </p>
          <p className="online-scoreline">Счёт: {run.you.score}</p>
          <TimerBar remainingMs={remainingMs} />
        </div>
        <div className="online-avatar-row championship-avatar-row">
          <AvatarView loadout={run.you.avatar} size="sm" label="Вы" />
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
            <label className="text-answer-label" htmlFor="champ-text-answer">
              Ваш ответ
            </label>
            <input
              id="champ-text-answer"
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
        {run.yourLastGraded && run.you.answeredCurrentRound ? (
          <p className="online-feedback">
            {run.yourLastGraded.timedOut
              ? "Время вышло"
              : run.yourLastGraded.correct
                ? `Верно (+${run.yourLastGraded.points})`
                : "Неверно"}
          </p>
        ) : null}
      </div>
    </section>
  );
}
