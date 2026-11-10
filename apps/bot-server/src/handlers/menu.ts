import type { Context } from "grammy";

const SOON = "Скоро 🚧";

let miniappUrl: string | null = null;

export function setMiniappUrl(url: string | null): void {
  miniappUrl = url;
}

async function replySoon(ctx: Context, title: string): Promise<void> {
  await ctx.reply(`*${title}*\n\n${SOON}`, { parse_mode: "Markdown" });
}

export async function handleSingle(ctx: Context): Promise<void> {
  if (miniappUrl) {
    await ctx.reply(
      [
        "*Одиночная игра*",
        "",
        "Откройте Mini App, чтобы пройти тематический уровень:",
        miniappUrl,
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return;
  }
  await ctx.reply(
    [
      "*Одиночная игра*",
      "",
      "Mini App готов в репозитории (`apps/telegram-miniapp`).",
      "Задайте `MINIAPP_URL` в окружении bot-server, чтобы получить ссылку здесь.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}

export async function handleOnline(ctx: Context): Promise<void> {
  if (miniappUrl) {
    await ctx.reply(
      [
        "*Онлайн*",
        "",
        "MVP: три раунда (выбор / мульти / свободный текст).",
        "Очки и рейтинг считает только сервер.",
        "",
        "Откройте Mini App:",
        miniappUrl,
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return;
  }
  await ctx.reply(
    [
      "*Онлайн*",
      "",
      "MVP готов в web / Mini App: Меню → Онлайн.",
      "Задайте `MINIAPP_URL`, чтобы получить ссылку здесь.",
    ].join("\n"),
    { parse_mode: "Markdown" },
  );
}

export async function handleChampionship(ctx: Context): Promise<void> {
  await replySoon(ctx, "Чемпионат");
}

export async function handleLeaders(ctx: Context): Promise<void> {
  await replySoon(ctx, "Таблица лидеров");
}

export async function handleShop(ctx: Context): Promise<void> {
  await replySoon(ctx, "Магазин");
}

export async function handleAccount(ctx: Context): Promise<void> {
  await replySoon(ctx, "Аккаунт");
}

export async function handleSettings(ctx: Context): Promise<void> {
  await replySoon(ctx, "Настройки");
}
