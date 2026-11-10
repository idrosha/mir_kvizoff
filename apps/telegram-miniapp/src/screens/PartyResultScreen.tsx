import type { PartyRoomPublicDto } from "@mir-games/adapters-telegram";

type Props = {
  room: PartyRoomPublicDto;
  onAgain: () => void;
  onMenu: () => void;
};

export function PartyResultScreen({ room, onAgain, onMenu }: Props) {
  return (
    <section className="screen">
      <h1>Итоги комнаты</h1>
      <p className="subtitle">{room.title}</p>
      <ol style={{ paddingLeft: "1.25rem" }}>
        {room.leaderboard.map((p, idx) => (
          <li key={p.playerId}>
            #{idx + 1} {p.displayName ?? p.playerId}: <strong>{p.score}</strong>
          </li>
        ))}
      </ol>
      <div className="actions" style={{ display: "grid", gap: "0.5rem" }}>
        <button type="button" className="btn" onClick={onAgain}>
          К комнатам
        </button>
        <button type="button" className="btn-secondary" onClick={onMenu}>
          В меню
        </button>
      </div>
    </section>
  );
}
