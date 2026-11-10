import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMiniappUrl,
  isLikelyWebAppUrl,
  miniappInlineKeyboard,
} from "./miniapp.js";

describe("buildMiniappUrl", () => {
  it("adds screen query except for menu", () => {
    assert.equal(
      buildMiniappUrl("https://example.com/app/", "map"),
      "https://example.com/app/?screen=map",
    );
    assert.equal(
      buildMiniappUrl("https://example.com/app/", "menu"),
      "https://example.com/app/",
    );
  });

  it("preserves existing query and overrides screen", () => {
    assert.equal(
      buildMiniappUrl("https://example.com/app?x=1&screen=shop", "online"),
      "https://example.com/app?x=1&screen=online",
    );
  });
});

describe("isLikelyWebAppUrl", () => {
  it("accepts https and local http", () => {
    assert.equal(isLikelyWebAppUrl("https://quiz.example/mini"), true);
    assert.equal(isLikelyWebAppUrl("http://127.0.0.1:5173"), true);
    assert.equal(isLikelyWebAppUrl("http://localhost:5173/"), true);
    assert.equal(isLikelyWebAppUrl("http://evil.example"), false);
    assert.equal(isLikelyWebAppUrl("not-a-url"), false);
  });
});

describe("miniappInlineKeyboard", () => {
  it("builds a web_app inline button", () => {
    const kb = miniappInlineKeyboard("https://example.com/app", {
      screen: "shop",
      buttonText: "Магазин",
    });
    const row = kb.inline_keyboard[0]?.[0] as
      | { text: string; web_app?: { url: string } }
      | undefined;
    assert.ok(row);
    assert.equal(row.text, "Магазин");
    assert.deepEqual(row.web_app, {
      url: "https://example.com/app?screen=shop",
    });
  });
});
