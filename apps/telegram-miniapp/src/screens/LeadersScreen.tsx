import { useEffect, useState } from "react";
import type { LeaderboardEntryDto, LeadersApiClient } from "@mir-games/adapters-telegram";

type Props = {
  leadersApi: LeadersApiClient;
  onBack: () => void;
};

export function LeadersScreen({ leadersApi, onBack }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void leadersApi
      .list(30)
      .then(setEntries)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [leadersApi]);

  return (
    <section className="screen">
      <button type="button" className="link-back" onClick={onBack}>
        ← Меню
      </button>
      <h1>Лидеры</h1>
      <p className="subtitle">Онлайн-рейтинг (сервер). Пусто — пока никто не играл.</p>
      {error ? <p className="error-banner">{error}</p> : null}
      {entries.length === 0 && !error ? <p className="subtitle">Нет записей.</p> : null}
      <ol style={{ paddingLeft: "1.25rem" }}>
        {entries.map((e, idx) => (
          <li key={e.playerId}>
            #{idx + 1} {e.displayName ?? e.playerId}: рейтинг {e.onlineRating}, очки{" "}
            {e.totalPoints}, уровней {e.levelsCompleted}
          </li>
        ))}
      </ol>
    </section>
  );
}
