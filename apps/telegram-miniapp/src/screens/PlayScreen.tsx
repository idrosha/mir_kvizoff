import { useEffect, useReducer, useState } from "react";
import type {
  AvatarLoadout,
  LevelRunResult,
  LevelSession,
  MultiChoiceQuestion,
  PlayerAnswer,
  Question,
  SingleChoiceQuestion,
} from "@mir-games/game-core";
import { AppShell } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";
import { TimerBar } from "../components/TimerBar";

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е", "Ж", "З", "И", "К"];

type Props = {
  session: LevelSession;
  avatar: AvatarLoadout;
  locationTitle: string;
  locationArtClass?: string;
  totalPoints?: number;
  onFinished: (result: LevelRunResult) => void;
};

function questionKey(q: Question | null, index: number): string {
  return q ? `${q.id}:${index}` : `done:${index}`;
}

export function PlayScreen({
  session,
  avatar,
  locationTitle,
  locationArtClass = "loc-egypt",
  totalPoints = 0,
  onFinished,
}: Props) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const [multiPick, setMultiPick] = useState<string[]>([]);
  const [singlePick, setSinglePick] = useState<string | null>(null);
  const state = session.getState();
  const question = session.currentQuestion();
  const remainingMs = session.remainingMs();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (session.getState().finished) {
        return;
      }
      tick();
      if (session.isTimedOut()) {
        const submit = session.submit(null);
        setMultiPick([]);
        setSinglePick(null);
        tick();
        if (submit.ok && submit.finished && submit.result) {
          onFinished(submit.result);
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [session, onFinished]);

  useEffect(() => {
    setMultiPick([]);
    setSinglePick(null);
  }, [state.questionIndex]);

  function submitAnswer(answer: PlayerAnswer): void {
    const result = session.submit(answer);
    setMultiPick([]);
    setSinglePick(null);
    tick();
    if (result.ok && result.finished && result.result) {
      onFinished(result.result);
    }
  }

  if (!question || state.finished) {
    return (
      <section className="screen play-screen no-chrome">
        <p>Завершение раунда…</p>
      </section>
    );
  }

  return (
    <AppShell title="Vopros" coins={totalPoints} hideNav>
      <section
        className="screen play-screen no-nav"
        key={questionKey(question, state.questionIndex)}
      >
        <article className="question-card">
          <div className="question-meta">
            <div className="question-meta-left">
              <span className="ms">explore</span>
              Вопрос {state.questionIndex + 1} из 30 · {question.domain}
            </div>
            <span className="xp-pill">
              <span className="ms">psychology</span>
              {question.difficulty}
            </span>
          </div>
          <h1 className="prompt">{question.prompt}</h1>
          <div className={`play-zone-image ${locationArtClass}`}>
            <div className="play-zone-image-art" aria-hidden="true" />
            <div className="play-zone-image-body">
              <span className="loc-chip">
                <span className="ms">pin_drop</span>
                {locationTitle}
              </span>
            </div>
          </div>
          <TimerBar remainingMs={remainingMs} />
        </article>

        <div className="play-zone-bottom">
          <aside className="play-zone-avatar">
            <AvatarView loadout={avatar} size="lg" label="Вы" />
          </aside>
          <div className="play-zone-answers">
            {question.format === "single_choice" ? (
              <SingleChoice
                question={question}
                selected={singlePick}
                onPick={setSinglePick}
                onSubmit={() => {
                  if (singlePick) {
                    submitAnswer({ format: "single_choice", optionId: singlePick });
                  }
                }}
              />
            ) : null}
            {question.format === "multi_choice" ? (
              <MultiChoice
                question={question}
                selected={multiPick}
                onToggle={(id) =>
                  setMultiPick((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                  )
                }
                onSubmit={() =>
                  submitAnswer({ format: "multi_choice", optionIds: [...multiPick] })
                }
              />
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function SingleChoice({
  question,
  selected,
  onPick,
  onSubmit,
}: {
  question: SingleChoiceQuestion;
  selected: string | null;
  onPick: (optionId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="options options-list" role="listbox" aria-label="Варианты">
      {question.options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          className={`option ${selected === opt.id ? "is-selected" : ""}`}
          aria-selected={selected === opt.id}
          onClick={() => onPick(opt.id)}
        >
          <span className="option-letter">{LETTERS[i] ?? String(i + 1)}</span>
          <span>{opt.label}</span>
          <span className="ms">
            {selected === opt.id ? "check_circle" : "radio_button_unchecked"}
          </span>
        </button>
      ))}
      <button type="button" className="btn btn-submit" disabled={!selected} onClick={onSubmit}>
        Подтвердить ответ
        <span className="ms">arrow_forward</span>
      </button>
    </div>
  );
}

function MultiChoice({
  question,
  selected,
  onToggle,
  onSubmit,
}: {
  question: MultiChoiceQuestion;
  selected: string[];
  onToggle: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="options options-list multi">
      <p className="hint">Может быть несколько верных ответов</p>
      {question.options.map((opt, i) => {
        const on = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            className={`option ${on ? "is-selected" : ""}`}
            aria-pressed={on}
            onClick={() => onToggle(opt.id)}
          >
            <span className="option-letter">{LETTERS[i] ?? String(i + 1)}</span>
            <span>{opt.label}</span>
            <span className="ms">{on ? "check_circle" : "radio_button_unchecked"}</span>
          </button>
        );
      })}
      <button
        type="button"
        className="btn btn-submit"
        disabled={selected.length === 0}
        onClick={onSubmit}
      >
        Подтвердить ответ
        <span className="ms">arrow_forward</span>
      </button>
    </div>
  );
}
