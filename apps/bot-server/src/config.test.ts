import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loadConfig,
  monorepoRoot,
  resolveTelegramBotToken,
} from "./config.js";

describe("resolveTelegramBotToken", () => {
  it("uses TELEGRAM_BOT_TOKEN when set", () => {
    const env: NodeJS.ProcessEnv = {
      TELEGRAM_BOT_TOKEN: " canonical-token ",
      TELEGRAM_BOT_TOKEN_MQ: "mq-token",
    };
    assert.equal(resolveTelegramBotToken(env), "canonical-token");
    assert.equal(env.TELEGRAM_BOT_TOKEN, " canonical-token ");
  });

  it("falls back to TELEGRAM_BOT_TOKEN_MQ and maps onto TELEGRAM_BOT_TOKEN", () => {
    const env: NodeJS.ProcessEnv = {
      TELEGRAM_BOT_TOKEN_MQ: " mq-only-token ",
    };
    assert.equal(resolveTelegramBotToken(env), "mq-only-token");
    assert.equal(env.TELEGRAM_BOT_TOKEN, "mq-only-token");
  });

  it("returns null when neither is set", () => {
    assert.equal(resolveTelegramBotToken({}), null);
  });
});

describe("loadConfig", () => {
  it("exposes mapped token via telegramBotToken", () => {
    const config = loadConfig({
      TELEGRAM_BOT_TOKEN_MQ: "from-mq",
      HTTP_PORT: "9000",
    });
    assert.equal(config.telegramBotToken, "from-mq");
    assert.equal(config.httpPort, 9000);
  });
});

describe("monorepoRoot", () => {
  it("resolves to a directory that contains package.json workspaces root marker", () => {
    const root = monorepoRoot();
    assert.match(root, /mir_(games|kvizoff)$/);
  });
});
