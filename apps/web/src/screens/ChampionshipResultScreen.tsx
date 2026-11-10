import type { ChampionshipRunDto } from "@mir-games/adapters-web";
import { AvatarView } from "../components/AvatarView";

type Props = {
  run: ChampionshipRunDto;
  onLobby: () => void;
  onMenu: () => void;
};

export function ChampionshipResultScreen({ run, onLobby, onMenu }: Props) {
  return (
    <section className="screen result-screen championship-result">
      <header className="brand-header">
        <p className="brand">Мир Квизов</p>
        <h1>Забег завершён</h1>
        <p className="subtitle">Очки чемпионата считает только сервер.</p>
      </header>

      <div className="championship-avatar-row">
        <AvatarView loadout={run.you.avatar} size="lg" label="Вы" />
      </div>

      <p className="result-score">{run.you.score}</p>
      <p className="subtitle">Период {run.periodKey}</p>

      <ul className="online-round-list">
        {run.roundThemes.map((theme, i) => (
          <li key={theme}>
            Раунд {i + 1}: {theme}
          </li>
        ))}
      </ul>

      <div className="actions">
        <button type="button" className="btn" onClick={onLobby}>
          К чемпионату
        </button>
        <button type="button" className="btn btn-ghost" onClick={onMenu}>
          В меню
        </button>
      </div>
    </section>
  );
}
