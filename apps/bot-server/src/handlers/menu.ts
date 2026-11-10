import type { Context } from "grammy";
import {
  isLikelyWebAppUrl,
  miniappInlineKeyboard,
  type MiniappScreen,
} from "../miniapp.js";

let miniappUrl: string | null = null;

export function setMiniappUrl(url: string | null): void {
  miniappUrl = url;
}

export function getMiniappUrl(): string | null {
  return miniappUrl;
}

type OpenOptions = {
  title: string;
  blurb: string[];
  screen: MiniappScreen;
  buttonText: string;
};

async function replyOpenMiniApp(
  ctx: Context,
  options: OpenOptions,
): Promise<void> {
  if (!miniappUrl) {
    await ctx.reply(
      [
        `*${options.title}*`,
        "",
        ...options.blurb,
        "",
        "Задайте `MINIAPP_URL` (публичный HTTPS URL Mini App) в окружении bot-server,",
        "чтобы здесь появилась кнопка WebApp.",
      ].join("\n"),
      { parse_mode: "Markdown" },
    );
    return;
  }

  const lines = [`*${options.title}*`, "", ...options.blurb, ""];
  if (!isLikelyWebAppUrl(miniappUrl)) {
    lines.push(
      "⚠️ `MINIAPP_URL` должен быть HTTPS (для Telegram WebApp).",
      "Ссылка на всякий случай:",
      miniappUrl,
    );
    await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
    return;
  }

  lines.push("Нажмите кнопку, чтобы открыть Mini App внутри Telegram:");
  await ctx.reply(lines.join("\n"), {
    parse_mode: "Markdown",
    reply_markup: miniappInlineKeyboard(miniappUrl, {
      screen: options.screen,
      buttonText: options.buttonText,
    }),
  });
}

export async function handleSingle(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Одиночная игра",
    blurb: [
      "Карта уровней и прохождение — в Mini App.",
      "Цепочка уровней и порог блока ≥1000 подтверждает bot-server.",
    ],
    screen: "map",
    buttonText: "Открыть карту",
  });
}

export async function handleOnline(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Онлайн",
    blurb: [
      "Два режима: *1 на 1* и *комната для компании* (до 30, открытая/закрытая).",
      "Ведущий комнаты видит live-результаты. Очки считает только сервер.",
    ],
    screen: "online",
    buttonText: "Открыть онлайн",
  });
}

export async function handleChampionship(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Чемпионат",
    blurb: [
      "Взнос и призовой фонд — на сервере.",
      "Участие открывает чемпионскую секцию магазина.",
    ],
    screen: "championship",
    buttonText: "Открыть чемпионат",
  });
}

export async function handleLeaders(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Таблица лидеров",
    blurb: ["Онлайн-рейтинг с bot-server."],
    screen: "leaders",
    buttonText: "Открыть лидеров",
  });
}

export async function handleShop(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Магазин",
    blurb: [
      "Косметика за очки / stub-деньги и повторные попытки уровней.",
      "Чемпионская секция — только после участия в чемпионате.",
    ],
    screen: "shop",
    buttonText: "Открыть магазин",
  });
}

export async function handleAccount(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Профиль",
    blurb: ["Статистика, имя, аватар и повторные попытки."],
    screen: "account",
    buttonText: "Открыть профиль",
  });
}

export async function handleSettings(ctx: Context): Promise<void> {
  await replyOpenMiniApp(ctx, {
    title: "Настройки",
    blurb: ["Язык и звук (сервер + локальный кэш)."],
    screen: "settings",
    buttonText: "Открыть настройки",
  });
}
