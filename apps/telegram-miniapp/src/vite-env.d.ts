/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type TelegramWebApp = {
  initData: string;
  ready(): void;
  expand(): void;
};

interface Window {
  Telegram?: { WebApp: TelegramWebApp };
}
