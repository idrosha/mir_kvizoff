import type { HapticStyle, HapticsPort } from "@mir-games/platform-contracts";
import type { TelegramWebApp } from "./telegram-webapp.js";

export function createTelegramHaptics(
  getWebApp: () => TelegramWebApp | undefined = () =>
    typeof window !== "undefined" ? window.Telegram?.WebApp : undefined,
): HapticsPort {
  return {
    impact(style: HapticStyle = "light") {
      const haptic = getWebApp()?.HapticFeedback;
      if (!haptic) {
        return;
      }
      if (style === "success" || style === "warning" || style === "error") {
        haptic.notificationOccurred(style);
        return;
      }
      const mapped =
        style === "heavy" ? "heavy" : style === "medium" ? "medium" : "light";
      haptic.impactOccurred(mapped);
    },
  };
}
