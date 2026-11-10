import { Bot } from "grammy";
import { MENU_COMMANDS } from "./commands/menu.js";
import { handleStart } from "./handlers/start.js";
import {
  handleAccount,
  handleChampionship,
  handleLeaders,
  handleOnline,
  handleSettings,
  handleShop,
  handleSingle,
} from "./handlers/menu.js";
import type { BotServerPorts } from "./ports/types.js";

export type CreateBotOptions = {
  token: string;
  ports: BotServerPorts;
};

export function createBot({ token, ports }: CreateBotOptions): Bot {
  // ports reserved for game-core adapters (auth, payments, storage, …)
  void ports;

  const bot = new Bot(token);

  bot.command("start", handleStart);
  bot.command("single", handleSingle);
  bot.command("online", handleOnline);
  bot.command("championship", handleChampionship);
  bot.command("leaders", handleLeaders);
  bot.command("shop", handleShop);
  bot.command("account", handleAccount);
  bot.command("settings", handleSettings);

  bot.catch((err) => {
    console.error("Bot error:", err.error);
  });

  return bot;
}

export async function registerBotCommands(bot: Bot): Promise<void> {
  await bot.api.setMyCommands([...MENU_COMMANDS]);
}
