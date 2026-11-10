import type { AvatarLoadout, LevelRunResult } from "@mir-games/game-core";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";

type Props = {
  result: LevelRunResult;
  avatar: AvatarLoadout;
  commitError?: string | null;
  totalPoints?: number;
  onMap: () => void;
  onMenu: () => void;
  onShop?: () => void;
  onNavigate: (tab: NavTab) => void;
};

export function ResultScreen({
  result,
  avatar,
  commitError,
  totalPoints = 0,
  onMap,
  onMenu,
  onShop,
  onNavigate,
}: Props) {
  const wrong = result.totalQuestions - result.correctCount;
  const accuracy =
    result.totalQuestions > 0
      ? Math.round((result.correctCount / result.totalQuestions) * 100)
      : 0;

  return (
    <AppShell
      title="Итоги"
      coins={totalPoints}
      active="map"
      onNavigate={onNavigate}
      onProfile={() => onNavigate("account")}
    >
      <section className="screen result-screen">
        <header className="result-header">
          <div className="result-laurel" aria-hidden="true">
            <span className="ms fill">workspace_premium</span>
          </div>
          <p className="eyebrow">
            <span className="ms">auto_awesome</span>
            Экспедиция завершена
          </p>
          <h1>Успешное прохождение!</h1>
          <p className="subtitle">Узел #{result.levelIndex} · очки за уровень сохранены</p>
          <AvatarView loadout={avatar} size="lg" label="Путешественник" />
        </header>

        <div className="accuracy-bar" aria-hidden="true">
          <div className="accuracy-ok" style={{ width: `${accuracy}%` }} />
          <div className="accuracy-bad" style={{ width: `${100 - accuracy}%` }} />
        </div>

        <dl className="result-stats">
          <div>
            <dt>Верных</dt>
            <dd className="ok">
              {result.correctCount}/{result.totalQuestions}
            </dd>
          </div>
          <div>
            <dt>Ошибки</dt>
            <dd className="error">{wrong}</dd>
          </div>
          <div>
            <dt>Итоговый счёт</dt>
            <dd>{result.score}</dd>
          </div>
          <div>
            <dt>Точность</dt>
            <dd>{accuracy}%</dd>
          </div>
        </dl>

        {commitError ? (
          <p className="error">{commitError}</p>
        ) : (
          <p className="ok">Прогресс сохранён на сервере</p>
        )}

        <div className="result-actions">
          <button type="button" className="btn btn-block" onClick={onMap}>
            Продолжить экспедицию
            <span className="ms">arrow_forward</span>
          </button>
          <button type="button" className="btn-secondary btn-block" onClick={onMenu}>
            <span className="ms">explore</span>
            На главную
          </button>
          <div className="result-actions-row">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => (onShop ? onShop() : onNavigate("shop"))}
            >
              <span className="ms">shopping_bag</span>
              В магазин
            </button>
            <button type="button" className="btn-ghost" onClick={onMap}>
              <span className="ms">replay</span>
              На карту
            </button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
