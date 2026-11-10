import { createChampionshipConfig } from "@mir-games/game-core";
import { loadConfig, loadEnvFiles } from "./config.js";
import { createBot, registerBotCommands } from "./bot.js";
import { createStubPorts } from "./ports/stubs.js";
import { createInMemoryProgressStore } from "./progress/store.js";
import { createInMemoryMatchStore } from "./online/match-store.js";
import { createInMemoryChampionshipStore } from "./championship/store.js";
import { startHttpApi } from "./api/http.js";
import { setMiniappUrl } from "./handlers/menu.js";

async function main(): Promise<void> {
  loadEnvFiles();
  const config = loadConfig();
  const ports = createStubPorts();
  const store = createInMemoryProgressStore();
  const matches = createInMemoryMatchStore({ progress: store });
  const championship = createInMemoryChampionshipStore({
    progress: store,
    config: createChampionshipConfig({
      openDaysOfMonth: config.championshipOpenDays,
    }),
  });

  setMiniappUrl(config.miniappUrl);

  await startHttpApi({
    port: config.httpPort,
    store,
    matches,
    championship,
    corsOrigin: config.corsOrigin,
  });

  if (!config.telegramBotToken) {
    console.log(
      "TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_TOKEN_MQ not set — HTTP API only (browser demo). Set either in root .env (or env) to also start the bot.",
    );
    return;
  }

  const bot = createBot({ token: config.telegramBotToken, ports });
  await registerBotCommands(bot);

  console.log("Мир Квизов bot-server starting (long polling)…");
  await bot.start({
    onStart: () => {
      console.log(
        "Bot is running. Token from TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN_MQ (root .env).",
      );
    },
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Fatal:", message);
  process.exit(1);
});
