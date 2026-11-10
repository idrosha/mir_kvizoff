import type { OnlineMatchPublicDto } from "@mir-games/adapters-telegram";
import { AvatarView } from "../components/AvatarView";

type Props = {
  match: OnlineMatchPublicDto;
  onAgain: () => void;
  onMenu: () => void;
};

export function OnlineResultScreen({ match, onAgain, onMenu }: Props) {
  const delta = match.ratingDelta ?? 0;
  const deltaLabel = delta > 0 ? `+${delta}` : `${delta}`;
  const won = match.you.score > match.opponent.score;
  const draw = match.you.score === match.opponent.score;

  return (
    <section className="screen result-screen online-result">
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>{draw ? "Ничья" : won ? "Победа" : "Поражение"}</h1>
        <p className="subtitle">Счёт выставил сервер — клиентский score не принимается.</p>
      </header>

      <div className="online-result-avatars">
        <AvatarView loadout={match.you.avatar} size="md" label="Вы" />
        <AvatarView
          loadout={match.opponent.avatar}
          size="md"
          label={match.opponent.displayName ?? "Соперник"}
        />
      </div>

      <p className="result-score">
        {match.you.score} : {match.opponent.score}
      </p>
      <p className="online-rating-delta">
        Рейтинг: <strong>{match.you.rating}</strong>{" "}
        <span className={delta >= 0 ? "delta-up" : "delta-down"}>({deltaLabel})</span>
      </p>

      <ul className="online-round-list">
        {match.roundThemes.map((theme, i) => (
          <li key={theme}>
            Раунд {i + 1}: {theme}
          </li>
        ))}
      </ul>

      <div className="actions">
        <button type="button" className="btn" onClick={onAgain}>
          Ещё матч
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          В меню
        </button>
      </div>
    </section>
  );
}
