import { useState } from "react";
import type { AccountSnapshotDto, ShopApiClient } from "@mir-games/adapters-web";
import type { StoragePort } from "@mir-games/platform-contracts";
import { AppShell, type NavTab } from "../components/AppShell";

type Props = {
  playerId: string;
  shopApi: ShopApiClient;
  storage: StoragePort;
  account: AccountSnapshotDto;
  onAccountChange: (next: AccountSnapshotDto) => void;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
};

export function SettingsScreen({
  playerId,
  shopApi,
  storage,
  account,
  onAccountChange,
  onBack,
  onNavigate,
}: Props) {
  const [language, setLanguage] = useState(account.settings.language);
  const [soundEnabled, setSoundEnabled] = useState(account.settings.soundEnabled);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.updateSettings(playerId, { language, soundEnabled });
      onAccountChange(next);
      // UI cache via StoragePort — not source of truth.
      await storage.set("settings-cache", next.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Nastroiki"
      coins={account.totalPoints}
      active="account"
      onNavigate={onNavigate}
      onProfile={() => onNavigate("account")}
    >
      <section className="screen settings-screen">
        <header className="brand-header">
          <p className="eyebrow">
            <span className="ms">tune</span>
            Интерфейс
          </p>
          <h1>Настройки</h1>
        </header>

        {error ? <p className="error-banner">{error}</p> : null}

        <ul className="settings-list">
          <li className="settings-row">
            <div className="settings-row-main">
              <div className="settings-row-icon">
                <span className="ms">language</span>
              </div>
              <div>
                <strong>Язык атласа</strong>
                <p className="subtitle">Сейчас MVP: RU</p>
              </div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={busy}
              aria-label="Язык"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </li>
          <li className="settings-row">
            <div className="settings-row-main">
              <div className="settings-row-icon">
                <span className="ms">graphic_eq</span>
              </div>
              <div>
                <strong>Звуки и эмбиент</strong>
                <p className="subtitle">Пока stub</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              disabled={busy}
              aria-label="Звук"
            />
          </li>
        </ul>

        <button type="button" className="btn btn-block" disabled={busy} onClick={() => void save()}>
          Сохранить
        </button>
        <button type="button" className="btn-secondary btn-block" onClick={onBack} style={{ marginTop: "0.55rem" }}>
          Назад
        </button>
      </section>
    </AppShell>
  );
}
