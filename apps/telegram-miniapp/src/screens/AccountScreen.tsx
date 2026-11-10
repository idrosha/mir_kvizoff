import { useState } from "react";
import type { AccountSnapshotDto, ShopApiClient } from "@mir-games/adapters-telegram";
import { AppShell, type NavTab } from "../components/AppShell";
import { AvatarView } from "../components/AvatarView";

type Props = {
  playerId: string;
  shopApi: ShopApiClient;
  account: AccountSnapshotDto;
  onAccountChange: (next: AccountSnapshotDto) => void;
  onDisplayNameChange: (name: string) => void;
  onBack: () => void;
  onNavigate: (tab: NavTab) => void;
  onSettings?: () => void;
  onShop?: () => void;
};

export function AccountScreen({
  playerId,
  shopApi,
  account,
  onAccountChange,
  onDisplayNameChange,
  onNavigate,
  onSettings,
  onShop,
}: Props) {
  const [nameDraft, setNameDraft] = useState(account.displayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveProfile(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const next = await shopApi.updateProfile(playerId, nameDraft);
      onAccountChange(next);
      if (next.displayName) {
        onDisplayNameChange(next.displayName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      title="Profil"
      coins={account.totalPoints}
      active="account"
      onNavigate={onNavigate}
      onProfile={() => undefined}
    >
      <section className="screen account-screen">
        <header className="brand-header">
          <p className="eyebrow">
            <span className="ms">explore</span>
            Исследователь
          </p>
          <h1>{account.displayName ?? "Профиль"}</h1>
          <p className="subtitle">{account.playerId}</p>
        </header>

        <div className="profile-stage">
          <AvatarView loadout={account.avatar} size="lg" label={account.displayName ?? "Игрок"} />
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <label className="field">
          <span>Имя</span>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={40}
            disabled={busy}
          />
        </label>
        <button
          type="button"
          className="btn btn-block"
          disabled={busy}
          onClick={() => void saveProfile()}
        >
          Сохранить профиль
        </button>

        <div className="bento">
          <div className="bento-card">
            <dt>Очки</dt>
            <dd>{account.totalPoints}</dd>
          </div>
          <div className="bento-card">
            <dt>Попытки</dt>
            <dd>{account.retryCredits}</dd>
          </div>
        </div>

        <h2 className="section-title">Статистика</h2>
        <dl className="stats-grid">
          <div>
            <dt>Пройдено уровней</dt>
            <dd>{account.stats.levelsCompleted}</dd>
          </div>
          <div>
            <dt>Всего попыток</dt>
            <dd>{account.stats.totalAttempts}</dd>
          </div>
          <div>
            <dt>Сумма лучших</dt>
            <dd>{account.stats.bestScoreSum}</dd>
          </div>
          <div>
            <dt>Вторые попытки</dt>
            <dd>{account.secondAttemptCount}</dd>
          </div>
          <div>
            <dt>Онлайн-рейтинг</dt>
            <dd>{account.onlineRating ?? "—"}</dd>
          </div>
          <div>
            <dt>Деньги (stub)</dt>
            <dd>{account.moneyBalance}</dd>
          </div>
        </dl>

        <ul className="settings-list">
          <li>
            <button
              type="button"
              className="settings-row"
              style={{ width: "100%", border: 0, background: "var(--surface-container-lowest)" }}
              onClick={() => (onShop ? onShop() : onNavigate("shop"))}
            >
              <div className="settings-row-main">
                <div className="settings-row-icon">
                  <span className="ms">checkroom</span>
                </div>
                <div>
                  <strong>В гардероб</strong>
                  <p className="subtitle">Примерка и покупка</p>
                </div>
              </div>
              <span className="ms">chevron_right</span>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="settings-row"
              style={{ width: "100%", border: 0, background: "var(--surface-container-lowest)" }}
              onClick={() => (onSettings ? onSettings() : onNavigate("menu"))}
            >
              <div className="settings-row-main">
                <div className="settings-row-icon">
                  <span className="ms">settings</span>
                </div>
                <div>
                  <strong>Настройки</strong>
                  <p className="subtitle">Язык и звук</p>
                </div>
              </div>
              <span className="ms">chevron_right</span>
            </button>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}
