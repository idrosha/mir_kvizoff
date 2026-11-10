/** Main menu command definitions (Russian UX). */
export const MENU_COMMANDS = [
  { command: "start", description: "Начать / главное меню" },
  { command: "single", description: "Одиночная игра" },
  { command: "online", description: "Онлайн" },
  { command: "championship", description: "Чемпионат" },
  { command: "leaders", description: "Таблица лидеров" },
  { command: "shop", description: "Магазин" },
  { command: "account", description: "Аккаунт" },
  { command: "settings", description: "Настройки" },
] as const;

export type MenuCommand = (typeof MENU_COMMANDS)[number]["command"];
