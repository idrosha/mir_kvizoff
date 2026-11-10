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
import { isLikelyWebAppUrl } from "./miniapp.js";
import type { BotServerPorts } from "./ports/types.js";

export type CreateBotOptions = {
  token: string;
  ports: BotServerPorts;
  /** Public Mini App URL for chat menu button / WebApp entry. */
  miniappUrl?: string | null;
};

export function createBot({ token, ports, miniappUrl }: CreateBotOptions): Bot {
  // ports reserved for game-core adapters (auth, payments, storage, …)
  void ports;
  void miniappUrl;

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

export async function registerBotCommands(
  bot: Bot,
  options: { miniappUrl?: string | null } = {},
): Promise<void> {
  await bot.api.setMyCommands([...MENU_COMMANDS]);

  const url = options.miniappUrl?.trim() || null;
  if (!url || !isLikelyWebAppUrl(url)) {
    // Default text menu button when Mini App URL is missing / not HTTPS-ready.
    await bot.api.setChatMenuButton({
      menu_button: { type: "commands" },
    });
    return;
  }

  try {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "Играть",
        web_app: { url },
      },
    });
    console.log("Chat menu button set to WebApp:", url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      "setChatMenuButton(web_app) failed — falling back to commands menu:",
      message,
    );
    await bot.api.setChatMenuButton({
      menu_button: { type: "commands" },
    });
  }
}
