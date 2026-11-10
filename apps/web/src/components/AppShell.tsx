import type { ReactNode } from "react";

export type NavTab = "menu" | "map" | "championship" | "shop" | "account";

type Props = {
  title: string;
  coins?: number;
  active?: NavTab | null;
  onNavigate?: (tab: NavTab) => void;
  onProfile?: () => void;
  hideNav?: boolean;
  children: ReactNode;
};

const NAV: { id: NavTab; label: string; icon: string }[] = [
  { id: "menu", label: "Главная", icon: "explore" },
  { id: "map", label: "Карта", icon: "map" },
  { id: "championship", label: "Чемпионат", icon: "military_tech" },
  { id: "shop", label: "Магазин", icon: "storefront" },
  { id: "account", label: "Профиль", icon: "account_circle" },
];

export function AppShell({
  title,
  coins = 0,
  active = null,
  onNavigate,
  onProfile,
  hideNav = false,
  children,
}: Props) {
  return (
    <>
      <header className="app-header pt-safe">
        <div className="app-header-inner">
          <div className="app-brand">
            <div className="app-logo" aria-hidden="true">
              <span className="ms fill">explore</span>
            </div>
            <div className="app-brand-text">
              <span className="app-brand-name">Мир Квизов</span>
              <span className="app-brand-screen">{title}</span>
            </div>
          </div>
          <div className="app-header-actions">
            <div className="coin-chip" aria-label={`Очки: ${coins}`}>
              <span className="ms">monetization_on</span>
              <span>{coins.toLocaleString("ru-RU")}</span>
            </div>
            <button
              type="button"
              className="profile-chip"
              aria-label="Профиль"
              onClick={onProfile}
            >
              <span className="ms">person</span>
            </button>
          </div>
        </div>
      </header>
      {children}
      {hideNav ? null : (
        <nav className="app-nav pb-safe" aria-label="Основная навигация">
          <div className="app-nav-inner">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`app-nav-item ${active === item.id ? "is-active" : ""}`}
                onClick={() => onNavigate?.(item.id)}
              >
                <span className="ms">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}
