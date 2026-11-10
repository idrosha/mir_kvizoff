/**
 * Bootstrap capability profile for Capacitor / Android.
 * game-core stays platform-agnostic; apps read this at shell bootstrap.
 */
export type MobileCapabilityProfile = {
  platform: "android-capacitor";
  touch: true;
  remote: false;
  safeArea: boolean;
  haptics: boolean;
  billing: "stub-play";
};

export const MOBILE_CAPABILITY_PROFILE: MobileCapabilityProfile = {
  platform: "android-capacitor",
  touch: true,
  remote: false,
  safeArea: true,
  haptics: true,
  billing: "stub-play",
};
