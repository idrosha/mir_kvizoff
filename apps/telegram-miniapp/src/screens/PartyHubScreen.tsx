import { useCallback, useEffect, useState } from "react";
import type {
  PartyApiClient,
  PartyRoomPublicDto,
  PartyRoomSummaryDto,
} from "@mir-games/adapters-telegram";

type Props = {
  playerId: string;
  partyApi: PartyApiClient;
  onEntered: (room: PartyRoomPublicDto) => void;
  onBack: () => void;
};

export function PartyHubScreen({ playerId, partyApi, onEntered, onBack }: Props) {
  const [openRooms, setOpenRooms] = useState<PartyRoomSummaryDto[]>([]);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOpen = useCallback(async () => {
    try {
      setOpenRooms(await partyApi.listOpen());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [partyApi]);

  useEffect(() => {
    void refreshOpen();
    const id = window.setInterval(() => void refreshOpen(), 3000);
    return () => window.clearInterval(id);
  }, [refreshOpen]);

  async function create(visibility: "open" | "closed"): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const room = await partyApi.create(playerId, {
        visibility,
        title: title.trim() || undefined,
      });
      onEntered(room);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function joinOpen(roomId: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      onEntered(await partyApi.join(playerId, { roomId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function joinClosed(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      onEntered(await partyApi.join(playerId, { code }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <button type="button" className="link-back" onClick={onBack} disabled={busy}>
        ← Онлайн
      </button>
      <h1>Комната для компании</h1>
      <p className="subtitle">
        Хост — ведущий (не отвечает). До 30 игроков. Открытая = из списка; закрытая = по коду.
      </p>

      <label style={{ display: "block", marginBottom: "0.5rem" }}>
        Название (необязательно)
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
        />
      </label>

      <div className="actions" style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" className="btn" disabled={busy} onClick={() => void create("open")}>
          Создать открытую
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => void create("closed")}
        >
          Создать закрытую (код)
        </button>
      </div>

      <h2>Войти по коду</h2>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABCDEF"
          maxLength={8}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn" disabled={busy || !code.trim()} onClick={() => void joinClosed()}>
          Войти
        </button>
      </div>

      <h2>Открытые комнаты</h2>
      {openRooms.length === 0 ? (
        <p className="subtitle">Пока нет открытых лобби.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {openRooms.map((r) => (
            <li
              key={r.roomId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "0.5rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid #ddd",
              }}
            >
              <div>
                <strong>{r.title}</strong>
                <div className="subtitle">
                  {r.hostDisplayName ?? "ведущий"} · {r.playerCount}/{r.maxPlayers}
                </div>
              </div>
              <button type="button" className="btn" disabled={busy} onClick={() => void joinOpen(r.roomId)}>
                Войти
              </button>
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="error-banner">{error}</p> : null}
    </section>
  );
}
