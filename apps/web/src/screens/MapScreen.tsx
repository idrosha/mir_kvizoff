import { useMemo, useState } from "react";
import type { AvatarLoadout, SinglePlayerProgress } from "@mir-games/game-core";
import {
  BLOCK_SCORE_GATE,
  BLOCK_SIZE,
  blockIndexForLevel,
  isLevelUnlocked,
  levelsInBlock,
  sumBlockScore,
} from "@mir-games/game-core";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";
import { MAP_LOCATIONS } from "@mir-games/question-bank";

type Props = {
  progress: SinglePlayerProgress;
  avatar: AvatarLoadout;
  totalPoints: number;
  onBack: () => void;
  onPlayLevel: (levelIndex: number) => void;
  onAvatar?: () => void;
  onNavigate: (tab: NavTab) => void;
};

function resolveBlockIndex(progress: SinglePlayerProgress): number {
  const maxIndex = Math.max(...MAP_LOCATIONS.map((l) => l.levelIndex), 1);
  const maxBlock = blockIndexForLevel(maxIndex);
  for (let b = 0; b <= maxBlock; b += 1) {
    const { start, end } = levelsInBlock(b);
    for (let i = start; i <= end; i += 1) {
      if (!progress.levels[i]?.completed) {
        return b;
      }
    }
  }
  return maxBlock;
}

export function MapScreen({
  progress,
  avatar,
  totalPoints,
  onPlayLevel,
  onAvatar,
  onNavigate,
}: Props) {
  const blockIndex = resolveBlockIndex(progress);
  const { start, end } = levelsInBlock(blockIndex);
  const blockLocations = MAP_LOCATIONS.filter(
    (loc) => loc.levelIndex >= start && loc.levelIndex <= end,
  );
  const blockScore = sumBlockScore(progress, blockIndex);
  const gateRatio = Math.max(0, Math.min(1, blockScore / BLOCK_SCORE_GATE));
  const blockTitle = blockIndex === 0 ? "Города и страны" : `Блок ${blockIndex + 1}`;

  const defaultSelected = useMemo(() => {
    const current = blockLocations.find(
      (loc) => isLevelUnlocked(progress, loc.levelIndex) && !progress.levels[loc.levelIndex]?.completed,
    );
    return current?.levelIndex ?? blockLocations[0]?.levelIndex ?? start;
  }, [blockLocations, progress, start]);

  const [selected, setSelected] = useState(defaultSelected);
  const selectedLoc =
    blockLocations.find((l) => l.levelIndex === selected) ?? blockLocations[0];
  const selectedUnlocked = selectedLoc
    ? isLevelUnlocked(progress, selectedLoc.levelIndex)
    : false;
  const selectedDone = selectedLoc
    ? progress.levels[selectedLoc.levelIndex]?.completed === true
    : false;
  const currentIndexInBlock = selectedLoc ? selectedLoc.levelIndex - start + 1 : 1;

  return (
    <AppShell
      title="Karta"
      coins={totalPoints}
      active="map"
      onNavigate={onNavigate}
      onProfile={onAvatar}
    >
      <section className="screen map-screen">
        <article className="region-card">
          <div className="region-card-top">
            <div>
              <p className="region-label">
                Регион {blockIndex + 1}: {blockTitle}
              </p>
              <h1 className="map-title">Маршрут экспедиции</h1>
            </div>
            <button
              type="button"
              className="explorer-chip"
              onClick={onAvatar}
              aria-label="Аватар"
            >
              <span className="explorer-chip-avatar">
                <AvatarView loadout={avatar} size="sm" label="" />
              </span>
              <span>
                Ур. {Math.max(1, Object.values(avatar.equipped).filter(Boolean).length)}
              </span>
            </button>
          </div>
          <div
            className="gate-bar"
            role="meter"
            aria-valuenow={blockScore}
            aria-valuemin={0}
            aria-valuemax={BLOCK_SCORE_GATE}
            aria-label="Очки блока"
          >
            <div className="gate-meta">
              <span>
                <span className="ms" style={{ fontSize: 14 }}>
                  stars
                </span>{" "}
                Шлюз экспедиции
              </span>
              <strong>
                {blockScore} / {BLOCK_SCORE_GATE}
              </strong>
            </div>
            <div className="gate-track">
              <div className="gate-fill" style={{ width: `${gateRatio * 100}%` }} />
            </div>
          </div>
        </article>

        <div className="map-route-head">
          <span>Маршрут экспедиции</span>
          <span>
            Узел {currentIndexInBlock} из {BLOCK_SIZE}
          </span>
        </div>

        <div className="map-path-scroll" aria-label={`Горизонтальный путь из ${BLOCK_SIZE} уровней`}>
          <ol className="map-path">
            {blockLocations.map((loc, i) => {
              const unlocked = isLevelUnlocked(progress, loc.levelIndex);
              const record = progress.levels[loc.levelIndex];
              const done = record?.completed === true;
              const current = unlocked && !done;
              const isSelected = loc.levelIndex === selected;
              return (
                <li key={loc.levelIndex} className="map-path-item">
                  {i > 0 ? (
                    <span
                      className={`map-chain ${unlocked || done ? "is-open" : "is-locked"}`}
                      aria-hidden="true"
                    />
                  ) : null}
                  <button
                    type="button"
                    className={`map-node ${loc.artClass} ${unlocked ? "is-open" : "is-locked"} ${done ? "is-done" : ""} ${current || isSelected ? "is-current" : ""}`}
                    onClick={() => setSelected(loc.levelIndex)}
                    aria-pressed={isSelected}
                  >
                    <div className="map-node-art" aria-hidden="true" />
                    {current ? <span className="map-play-pill">Играть</span> : null}
                    {!unlocked ? (
                      <span className="map-lock" aria-hidden="true">
                        <span className="ms">lock</span>
                      </span>
                    ) : null}
                    {done ? (
                      <span className="map-lock" aria-hidden="true">
                        <span className="ms fill">check_circle</span>
                      </span>
                    ) : null}
                    <div className="map-node-body">
                      <p className="map-node-index">
                        #{loc.levelIndex}
                        {current ? " · текущий" : ""}
                      </p>
                      <h2>{loc.title}</h2>
                      <p className="map-node-blurb">{loc.blurb}</p>
                      {done ? <p className="map-score">Лучший: {record.bestScore}</p> : null}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {selectedLoc ? (
          <article className="map-detail">
            <div className="map-detail-top">
              <div>
                <p className="map-detail-ready">
                  <span className="ms fill">verified</span>
                  {selectedUnlocked
                    ? selectedDone
                      ? "Пройдено"
                      : "Готов к старту"
                    : "Закрыто"}
                </p>
                <h2>
                  Уровень {selectedLoc.levelIndex}: {selectedLoc.title}
                </h2>
                <p>{selectedLoc.blurb}</p>
              </div>
              <div className="map-detail-node">
                {selectedLoc.levelIndex}
                <br />
                узел
              </div>
            </div>
            <div className="map-rewards">
              <div className="map-reward">
                <span className="ms">monetization_on</span>
                очки
              </div>
              <div className="map-reward">
                <span className="ms">psychology</span>
                30 вопр.
              </div>
              <div className="map-reward">
                <span className="ms">military_tech</span>
                прогресс
              </div>
            </div>
            <button
              type="button"
              className="btn btn-block"
              disabled={!selectedUnlocked || selectedDone}
              onClick={() => onPlayLevel(selectedLoc.levelIndex)}
            >
              <span className="ms fill">play_arrow</span>
              {!selectedUnlocked
                ? "Уровень закрыт"
                : selectedDone
                  ? "Уже пройден"
                  : `Начать уровень ${selectedLoc.levelIndex}: ${selectedLoc.title}`}
            </button>
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}
