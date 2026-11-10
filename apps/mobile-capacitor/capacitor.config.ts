import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor Android shell for Мир Квизов.
 * Wraps this app's Vite `dist/` (same game-core + ports as web; adapters-mobile for haptics/billing stubs).
 * No Play Billing keys or other secrets here.
 */
const config: CapacitorConfig = {
  appId: "games.mirkvizov.android",
  appName: "Мир Квизов",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
