import type { AnalyticsPort, AnalyticsProps } from "@mir-games/platform-contracts";

/** Console analytics stub — replace with real sink later. */
export function createWebAnalytics(debug = false): AnalyticsPort {
  return {
    track(event: string, props?: AnalyticsProps) {
      if (debug) {
        console.info("[analytics:web]", event, props ?? {});
      }
    },
    identify(playerId: string, traits?: AnalyticsProps) {
      if (debug) {
        console.info("[analytics:web] identify", playerId, traits ?? {});
      }
    },
  };
}
