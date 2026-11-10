import { ANSWER_TIME_MS } from "@mir-games/game-core";

type Props = {
  remainingMs: number;
};

function timerTone(ratio: number): "ok" | "mid" | "low" {
  if (ratio > 0.3) return "ok";
  if (ratio > 0.15) return "mid";
  return "low";
}

export function TimerBar({ remainingMs }: Props) {
  const ratio = Math.max(0, Math.min(1, remainingMs / ANSWER_TIME_MS));
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const tone = timerTone(ratio);

  return (
    <div
      className={`timer timer-${tone}`}
      role="timer"
      aria-live="polite"
      aria-valuenow={seconds}
      aria-valuemin={0}
      aria-valuemax={ANSWER_TIME_MS / 1000}
    >
      <div className="timer-track">
        <div className="timer-fill" style={{ transform: `scaleX(${ratio})` }} />
      </div>
      <div className="timer-caption">
        <span className="timer-label">
          <span className="ms" style={{ fontSize: 14 }}>
            hourglass_top
          </span>{" "}
          {seconds} сек
        </span>
        <span>Осталось время</span>
      </div>
    </div>
  );
}
