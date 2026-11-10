import { useCallback, useEffect, useState } from "react";
import type {
  ChampionshipApiClient,
  ChampionshipRunDto,
  ChampionshipStatusDto,
} from "@mir-games/adapters-web";
import { CHAMPIONSHIP_ENTRY_PRODUCT_ID } from "@mir-games/game-core";
import type { PaymentPort } from "@mir-games/platform-contracts";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  championshipApi: ChampionshipApiClient;
  payment: PaymentPort;
  totalPoints?: number;
  onStarted: (run: ChampionshipRunDto) => void;
  onAccountRefresh: () => void;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
};

export function ChampionshipLobbyScreen({
  playerId,
  championshipApi,
  payment,
  totalPoints = 0,
  onStarted,
  onAccountRefresh,
  onBack,
  onNavigate,
}: Props) {
  const [status, setStatus] = useState<ChampionshipStatusDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remind, setRemind] = useState(true);

  const refresh = useCallback(async () => {
    const next = await championshipApi.status(playerId);
    setStatus(next);
  }, [championshipApi, playerId]);

  useEffect(() => {
    void refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err));
    });
  }, [refresh]);

  async function enter(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const paid = await payment.purchase(CHAMPIONSHIP_ENTRY_PRODUCT_ID);
      if (!paid.ok) {
        throw new Error(paid.reason ?? "Payment failed");
      }
      await refresh();
      onAccountRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function startRun(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const run = await championshipApi.start(playerId);
      onStarted(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function settle(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await championshipApi.settle(playerId);
      setStatus(next);
      onAccountRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <AppShell title="Kubok" coins={totalPoints} active="championship" onNavigate={onNavigate}>
        <section className="screen">
          <p>Загрузка чемпионата…</p>
          {error ? <p className="error-banner">{error}</p> : null}
          <button type="button" className="btn-ghost" onClick={onBack}>
            Назад
          </button>
        </section>
      </AppShell>
    );
  }

  const sharePct = Math.round(status.prizePoolShare * 100);

  return (
    <AppShell
      title="Kubok"
      coins={totalPoints}
      active="championship"
      onNavigate={onNavigate}
      onProfile={() => onNavigate("account")}
    >
      <section className="screen championship-lobby">
        <div className="champ-status-row">
          <span className="chip chip-live">
            <span className="ms fill">verified</span>
            Сезонный кубок
          </span>
          <span className="chip chip-sand">
            <span className="ms">calendar_today</span>
            {status.periodKey}
          </span>
          <span className={`chip ${status.open ? "chip-route" : ""}`}>
            {status.open ? "Регистрация открыта" : "Вход сегодня закрыт"}
          </span>
        </div>

        <h1>Кубок Шёлкового Пути</h1>
        <p className="subtitle">
          Период {status.periodKey} · фонд stub · {sharePct}% взноса в призовой пул
        </p>

        <div className="countdown-grid" aria-label="Окно турнира">
          <div className="countdown-cell">
            <strong>{status.open ? "сейчас" : "—"}</strong>
            <span>статус</span>
          </div>
          <div className="countdown-cell">
            <strong>{status.entryFeeMoney}</strong>
            <span>взнос</span>
          </div>
          <div className="countdown-cell">
            <strong>{status.prizePool}</strong>
            <span>фонд</span>
          </div>
          <div className="countdown-cell">
            <strong>{status.you.moneyBalance}</strong>
            <span>баланс</span>
          </div>
        </div>

        <div className="championship-avatar-row">
          <AvatarView loadout={status.you.avatar} size="lg" label="Ваш аватар" />
        </div>

        <ul className="conditions-card">
          <li>
            <span className="ms">quiz</span>
            Платный вход в заданные дни месяца (UTC)
          </li>
          <li>
            <span className="ms">military_tech</span>
            Часть взноса идёт победителю периода
          </li>
          <li>
            <span className="ms">storefront</span>
            Участие открывает чемпионскую секцию магазина
          </li>
        </ul>

        <label className="settings-row" style={{ marginBottom: "0.85rem" }}>
          <div className="settings-row-main">
            <div className="settings-row-icon">
              <span className="ms">notifications_active</span>
            </div>
            <div>
              <strong>Напомнить за 1 час до старта</strong>
              <p className="subtitle">Локальный флаг UI (MVP)</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={remind}
            onChange={(e) => setRemind(e.target.checked)}
            aria-label="Напоминание"
          />
        </label>

        <p className="championship-days">
          Дни месяца (UTC): {status.openDaysOfMonth.slice(0, 8).join(", ")}
          {status.openDaysOfMonth.length > 8 ? "…" : ""}
        </p>

        {status.you.entered ? (
          <p className="online-status">
            Вы в чемпионате · счёт {status.you.score}
            {status.you.runFinished ? " · забег завершён" : ""}
            {status.you.championshipParticipated ? " · секция магазина открыта" : ""}
          </p>
        ) : (
          <p className="online-status">Участие платное — часть взноса идёт в призовой фонд.</p>
        )}

        {status.periodStatus === "settled" ? (
          <p className="online-status">
            Итог: победитель {status.winnerPlayerId ?? "—"}, выплата stub {status.winnerPayout ?? 0}
          </p>
        ) : null}

        {error ? <p className="error-banner">{error}</p> : null}

        <ul className="championship-board">
          {status.leaderboard.length === 0 ? (
            <li>Пока нет участников</li>
          ) : (
            status.leaderboard.map((row, i) => (
              <li key={row.playerId}>
                #{i + 1} {row.displayName ?? row.playerId}: {row.score}
                {row.runFinished ? "" : " (в игре)"}
              </li>
            ))
          )}
        </ul>

        <div className="actions">
          {!status.you.entered ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={busy || !status.open}
              onClick={() => void enter()}
            >
              <span className="ms">app_registration</span>
              {busy ? "Оплата…" : `Зарегистрироваться — ${status.entryFeeMoney} монет`}
            </button>
          ) : null}
          {status.you.entered && !status.you.runFinished ? (
            <button
              type="button"
              className="btn btn-block"
              disabled={busy}
              onClick={() => void startRun()}
            >
              {status.you.runActive ? "Продолжить" : "Играть"}
            </button>
          ) : null}
          {status.periodStatus !== "settled" && status.leaderboard.some((r) => r.runFinished) ? (
            <button
              type="button"
              className="btn-ghost btn-block"
              disabled={busy}
              onClick={() => void settle()}
            >
              Определить победителя (stub)
            </button>
          ) : null}
          <button type="button" className="btn-secondary btn-block" onClick={onBack}>
            Назад
          </button>
        </div>
      </section>
    </AppShell>
  );
}
