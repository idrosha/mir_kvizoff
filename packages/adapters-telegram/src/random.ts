import type { RandomPort } from "@mir-games/platform-contracts";

export function createTelegramRandom(): RandomPort {
  return {
    next() {
      return Math.random();
    },
    nextInt(minInclusive: number, maxInclusive: number) {
      const span = maxInclusive - minInclusive + 1;
      return minInclusive + Math.floor(Math.random() * span);
    },
  };
}
