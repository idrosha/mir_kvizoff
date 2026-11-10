import type { Context } from "grammy";

const WELCOME = [
  "Добро пожаловать в *Мир Квизов*!",
  "",
  "Познавательные квизы: вопросы становятся сложнее к концу уровня,",
  "на ответ даётся 10 секунд.",
  "",
  "Выберите раздел в меню или командой:",
  "• /single — одиночная игра",
  "• /online — онлайн",
  "• /championship — чемпионат",
  "• /leaders — таблица лидеров",
  "• /shop — магазин",
  "• /account — аккаунт",
  "• /settings — настройки",
].join("\n");

export async function handleStart(ctx: Context): Promise<void> {
  await ctx.reply(WELCOME, { parse_mode: "Markdown" });
}
