import type { Context } from "grammy";
import {
  isLikelyWebAppUrl,
  miniappInlineKeyboard,
} from "../miniapp.js";
import { getMiniappUrl } from "./menu.js";

const WELCOME = [
  "Добро пожаловать в *Мир Квизов*!",
  "",
  "Познавательные квизы: вопросы становятся сложнее к концу уровня,",
  "на ответ даётся 10 секунд.",
  "",
  "Игра открывается как Telegram Mini App внутри бота.",
  "",
  "Команды (каждая открывает Mini App, если задан `MINIAPP_URL`):",
  "• /single — одиночная / карта",
  "• /online — 1v1 и party-комнаты",
  "• /championship — чемпионат",
  "• /leaders — таблица лидеров",
  "• /shop — магазин",
  "• /account — профиль",
  "• /settings — настройки",
].join("\n");

export async function handleStart(ctx: Context): Promise<void> {
  const miniappUrl = getMiniappUrl();
  if (miniappUrl && isLikelyWebAppUrl(miniappUrl)) {
    await ctx.reply(WELCOME, {
      parse_mode: "Markdown",
      reply_markup: miniappInlineKeyboard(miniappUrl, {
        buttonText: "Открыть Мир Квизов",
      }),
    });
    return;
  }

  const extra =
    miniappUrl != null
      ? [
          "",
          "⚠️ `MINIAPP_URL` задан, но для WebApp-кнопки нужен HTTPS.",
          "Ссылка:",
          miniappUrl,
        ].join("\n")
      : [
          "",
          "Пока `MINIAPP_URL` не задан — локально откройте Mini App:",
          "`npm run miniapp:dev` → http://127.0.0.1:5173",
          "(API: `npm run bot:dev` → :8787).",
        ].join("\n");

  await ctx.reply(`${WELCOME}${extra}`, { parse_mode: "Markdown" });
}
