/** Minimal Telegram WebApp typings used by adapters (no @twa-dev dependency). */

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
};

export type TelegramWebAppInitDataUnsafe = {
  user?: TelegramWebAppUser;
  query_id?: string;
  auth_date?: number;
  hash?: string;
};

export type TelegramHapticFeedback = {
  impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
  notificationOccurred(type: "error" | "success" | "warning"): void;
  selectionChanged(): void;
};

export type TelegramWebApp = {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  ready(): void;
  expand(): void;
  close(): void;
  themeParams: Record<string, string>;
  colorScheme: "light" | "dark";
  HapticFeedback?: TelegramHapticFeedback;
  BackButton?: {
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  MainButton?: {
    text: string;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
};

export type TelegramNamespace = {
  WebApp: TelegramWebApp;
};

declare global {
  interface Window {
    Telegram?: TelegramNamespace;
  }
}

export {};
