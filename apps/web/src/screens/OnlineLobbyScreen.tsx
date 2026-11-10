import { useEffect, useState } from "react";
import type { OnlineApiClient, OnlineMatchPublicDto } from "@mir-games/adapters-web";
import type { AvatarLoadout } from "@mir-games/game-core";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  avatar: AvatarLoadout;
  onlineApi: OnlineApiClient;
  totalPoints?: number;
  onMatched: (match: OnlineMatchPublicDto) => void;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
};

export function OnlineLobbyScreen({
  playerId,
  avatar,
  onlineApi,
  totalPoints = 0,
  onMatched,
  onBack,
  onNavigate,
}: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queueSec, setQueueSec] = useState(0);

  useEffect(() => {
    void onlineApi
      .getRating(playerId)
      .then(setRating)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [onlineApi, playerId]);

  useEffect(() => {
    if (!busy) {
      setQueueSec(0);
      return;
    }
    const id = window.setInterval(() => setQueueSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [busy]);

  async function findMatch(): Promise<void> {
    setBusy(true);
    setError(null);
    setStatus("Поиск соперника…");
    try {
      const result = await onlineApi.queue(playerId, "stub-bot");
      if (result.status === "matched" && result.match) {
        setStatus("Матч найден");
        onMatched(result.match);
        return;
      }
      setStatus("В очереди — ждём второго игрока");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  const mm = String(Math.floor(queueSec / 60)).padStart(2, "0");
  const ss = String(queueSec % 60).padStart(2, "0");

  return (
    <AppShell
      title="Duel"
      coins={totalPoints}
      active="menu"
      onNavigate={onNavigate}
      onProfile={() => onNavigate("account")}
    >
      <section className="screen online-lobby">
        <div className="online-banner">
          <span className="chip chip-route">
            <span className="ms">explore</span>
            Рейтинговый матч 1 на 1
          </span>
          <span className="chip">
            <span style={{ color: "var(--ok)" }}>●</span> Пинг: stub
          </span>
        </div>

        <div className="online-title-row">
          <h1>Быстрая дуэль исследователей</h1>
          <span className="chip chip-sand">3 раунда</span>
        </div>

        <div className="theme-card">
          <div className="theme-card-icon">
            <span className="ms">public</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p>Тематика экспедиции</p>
            <h2>Атлас и чудеса света</h2>
          </div>
          <span className="ms" aria-hidden="true">
            tune
          </span>
        </div>

        <div className="radar-card">
          <div className="radar-ring" aria-hidden="true">
            <span className="ms fill">near_me</span>
          </div>
          <p className="online-status">
            {busy ? "Поиск равного соперника" : status ?? "Готовы к дуэли"}
          </p>
          <p className="subtitle">
            Время в очереди: <strong>{mm}:{ss}</strong> · рейтинг: {rating ?? "…"}
          </p>
        </div>

        <div className="duel-arena">
          <article className="duel-card">
            <div className="duel-card-head">
              <span className="chip chip-route">Вы</span>
              <span className="chip chip-sand">
                <span className="ms">stars</span>
                {rating ?? "—"}
              </span>
            </div>
            <div className="duel-stage">
              <AvatarView loadout={avatar} size="md" label="Вы" />
            </div>
          </article>
          <article className="duel-card">
            <div className="duel-card-head">
              <span className="chip">Оппонент</span>
              <span className="chip">±50 ELO</span>
            </div>
            <div className="duel-stage">
              <span className="ms">person_search</span>
              <p className="subtitle" style={{ marginTop: "0.5rem" }}>
                Спутник в пути
              </p>
            </div>
          </article>
        </div>

        <div className="fair-note">
          <span className="ms">verified</span>
          <p>
            Честная географическая дуэль: таймеры одновременны, очки считает сервер. Выбор, несколько
            верных и свободный текст.
          </p>
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <div className="actions">
          <button
            type="button"
            className="btn btn-block"
            disabled={busy}
            onClick={() => void findMatch()}
          >
            {busy ? "Ищем…" : "Найти матч"}
          </button>
          <button
            type="button"
            className="btn-secondary btn-block"
            onClick={onBack}
            disabled={busy}
          >
            <span className="ms">close</span>
            {busy ? "Отменить поиск" : "Назад"}
          </button>
        </div>
      </section>
    </AppShell>
  );
}
