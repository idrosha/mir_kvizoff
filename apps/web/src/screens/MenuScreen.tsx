import type { AvatarLoadout } from "@mir-games/game-core";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";

type MenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconTone?: "primary" | "sand" | "default";
  chip?: { label: string; tone: "route" | "live" | "sand" | "new" };
  stub?: boolean;
};

const ITEMS: MenuItem[] = [
  {
    id: "single",
    title: "Одиночная игра",
    subtitle: "Продолжить маршрут экспедиции",
    icon: "map",
    iconTone: "primary",
    chip: { label: "Маршрут", tone: "route" },
  },
  {
    id: "online",
    title: "Онлайн-дуэль",
    subtitle: "Быстрый поиск равного соперника",
    icon: "swords",
    chip: { label: "Live", tone: "live" },
  },
  {
    id: "championship",
    title: "Чемпионат",
    subtitle: "Кубок Шёлкового Пути",
    icon: "military_tech",
    iconTone: "sand",
    chip: { label: "Набор", tone: "sand" },
  },
  {
    id: "leaders",
    title: "Таблица лидеров",
    subtitle: "Топ исследователей сезона",
    icon: "leaderboard",
    stub: true,
  },
  {
    id: "shop",
    title: "Гардероб и Магазин",
    subtitle: "Примерка и снаряжение",
    icon: "checkroom",
    chip: { label: "Новое", tone: "new" },
  },
  {
    id: "account",
    title: "Настройки и Профиль",
    subtitle: "Статистика, имя, язык",
    icon: "settings",
  },
];

const GEAR = [
  { icon: "nordic_walking", label: "Шляпа", slot: "hat" },
  { icon: "visibility", label: "Оптика", slot: "glasses" },
  { icon: "checkroom", label: "Парка", slot: "shirt" },
  { icon: "dry_cleaning", label: "Брюки", slot: "pants" },
  { icon: "hiking", label: "Ботинки", slot: "shoes" },
  { icon: "backpack", label: "Сумка", slot: "accessory" },
] as const;

type Props = {
  displayName?: string;
  avatar: AvatarLoadout;
  totalPoints: number;
  onSelect: (id: string) => void;
  onNavigate: (tab: NavTab) => void;
  onAvatar?: () => void;
};

export function MenuScreen({
  displayName,
  avatar,
  totalPoints,
  onSelect,
  onNavigate,
  onAvatar,
}: Props) {
  const equippedCount = Object.values(avatar.equipped).filter(Boolean).length;

  return (
    <AppShell
      title="Glavnaya"
      coins={totalPoints}
      active="menu"
      onNavigate={onNavigate}
      onProfile={() => onSelect("account")}
    >
      <section className="screen menu-screen">
        <header className="menu-hero">
          <p className="eyebrow">
            <span className="ms fill">explore</span>
            Интеллектуальные экспедиции
          </p>
          <h1 className="brand-hero">Мир Квизов</h1>
          <p className="subtitle">
            Открывайте континенты, отвечая на вопросы всемирного атласа
          </p>
        </header>

        <section className="traveler-card" aria-label="Путешественник">
          <div className="traveler-card-topo" aria-hidden="true" />
          <div className="traveler-card-top">
            <div className="traveler-rank">
              <span className="traveler-level">{Math.max(1, equippedCount + 1)}</span>
              <div>
                <h2>{displayName ?? "Исследователь"}</h2>
                <p>Экспедиция · мягкий travel</p>
              </div>
            </div>
            <span className="chip chip-sand">
              <span className="ms">military_tech</span>
              В пути
            </span>
          </div>
          <div className="traveler-body">
            <button
              type="button"
              className="traveler-stage"
              onClick={() => (onAvatar ? onAvatar() : onSelect("account"))}
              aria-label="Открыть профиль персонажа"
            >
              <AvatarView loadout={avatar} size="lg" label="" />
              <div className="traveler-stage-cap">
                <span>Аватар снаряжен</span>
                <span>{equippedCount}/6 предметов</span>
              </div>
            </button>
            <div className="gear-grid" aria-label="Снаряжение">
              {GEAR.map((g) => (
                <div key={g.slot} className="gear-tile">
                  <span className="ms">{g.icon}</span>
                  <span>{g.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="xp-row">
            <div className="xp-meta">
              <span>Ранг экспедиции</span>
              <strong>
                {totalPoints.toLocaleString("ru-RU")} очков
              </strong>
            </div>
            <div className="xp-track" aria-hidden="true">
              <div
                className="xp-fill"
                style={{ width: `${Math.min(100, (totalPoints % 1000) / 10)}%` }}
              />
            </div>
          </div>
        </section>

        <nav className="menu-list" aria-label="Главное меню">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="menu-item"
              onClick={() => onSelect(item.id)}
            >
              <div className="menu-item-main">
                <div
                  className={`menu-item-icon ${
                    item.iconTone === "primary"
                      ? "is-primary"
                      : item.iconTone === "sand"
                        ? "is-sand"
                        : ""
                  }`}
                >
                  <span className="ms">{item.icon}</span>
                </div>
                <div className="menu-item-copy">
                  <div className="menu-item-title-row">
                    <span className="menu-item-title">{item.title}</span>
                    {item.stub ? <span className="badge">скоро</span> : null}
                    {item.chip ? (
                      <span className={`chip chip-${item.chip.tone}`}>{item.chip.label}</span>
                    ) : null}
                  </div>
                  <span className="menu-item-sub">{item.subtitle}</span>
                </div>
              </div>
              <span className="ms menu-item-chevron">arrow_forward_ios</span>
            </button>
          ))}
        </nav>

        <aside className="bulletin">
          <span className="ms">public</span>
          <div>
            <h3>Экспедиционный бюллетень</h3>
            <p>Блок 1 открыт: десять локаций от Египта до Мексики.</p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
