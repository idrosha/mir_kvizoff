import type { HapticStyle, HapticsPort } from "@mir-games/platform-contracts";

type CapacitorHapticsPlugin = {
  impact?: (options: { style: string }) => Promise<void>;
  notification?: (options: { type: string }) => Promise<void>;
};

type CapacitorBridge = {
  Plugins?: { Haptics?: CapacitorHapticsPlugin };
  isNativePlatform?: () => boolean;
};

/**
 * HapticsPort for Capacitor Android.
 * Uses Capacitor Haptics plugin when present; otherwise Vibration API / no-op.
 * No native plugin is required for browser / CI smoke — this is a stub-friendly port.
 */
export function createMobileHaptics(): HapticsPort {
  return {
    impact(style: HapticStyle = "light") {
      const cap = (globalThis as { Capacitor?: CapacitorBridge }).Capacitor;
      const plugin = cap?.Plugins?.Haptics;
      if (plugin) {
        void fireCapacitorHaptic(plugin, style);
        return;
      }
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

async function fireCapacitorHaptic(
  plugin: CapacitorHapticsPlugin,
  style: HapticStyle,
): Promise<void> {
  try {
    if (style === "success" || style === "warning" || style === "error") {
      if (plugin.notification) {
        await plugin.notification({
          type: style === "success" ? "SUCCESS" : style === "warning" ? "WARNING" : "ERROR",
        });
        return;
      }
    }
    if (plugin.impact) {
      const mapped =
        style === "heavy" || style === "error"
          ? "HEAVY"
          : style === "medium" || style === "warning"
            ? "MEDIUM"
            : "LIGHT";
      await plugin.impact({ style: mapped });
    }
  } catch {
    // Plugin missing or rejected — silent stub.
  }
}
