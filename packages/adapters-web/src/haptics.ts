import type { HapticStyle, HapticsPort } from "@mir-games/platform-contracts";

/**
 * Browser haptics: Vibration API when available; otherwise no-op.
 * Telegram Mini App uses WebApp.HapticFeedback instead.
 */
export function createWebHaptics(): HapticsPort {
  return {
    impact(style: HapticStyle = "light") {
      if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
        return;
      }
      const ms =
        style === "heavy" || style === "error"
          ? 40
          : style === "medium" || style === "warning"
            ? 25
            : 12;
      try {
        navigator.vibrate(ms);
      } catch {
        // ignore unsupported / blocked vibration
      }
    },
  };
}
