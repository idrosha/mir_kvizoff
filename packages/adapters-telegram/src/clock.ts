import type { ClockPort } from "@mir-games/platform-contracts";

/** Browser / WebView wall clock. */
export function createTelegramClock(): ClockPort {
  return {
    nowMs() {
      return Date.now();
    },
  };
}
