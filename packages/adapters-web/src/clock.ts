import type { ClockPort } from "@mir-games/platform-contracts";

/** Browser wall clock. */
export function createWebClock(): ClockPort {
  return {
    nowMs() {
      return Date.now();
    },
  };
}
