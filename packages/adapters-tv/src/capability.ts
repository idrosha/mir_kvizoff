/**
 * Bootstrap capability profile for TV / leanback WebView.
 * Safe-zone insets approximate 5% overscan; UI shells apply CSS vars from this.
 */
export type TvCapabilityProfile = {
  platform: "tv-web";
  touch: false;
  remote: true;
  gamepad: true;
  safeArea: true;
  /** Fraction of viewport inset on each edge for overscan. */
  safeZoneInset: number;
  largeUi: true;
  billing: "stub-web";
};

export const TV_CAPABILITY_PROFILE: TvCapabilityProfile = {
  platform: "tv-web",
  touch: false,
  remote: true,
  gamepad: true,
  safeArea: true,
  safeZoneInset: 0.05,
  largeUi: true,
  billing: "stub-web",
};

/** CSS custom properties derived from the TV capability profile. */
export function tvSafeZoneCssVars(
  profile: TvCapabilityProfile = TV_CAPABILITY_PROFILE,
): Record<string, string> {
  const pct = `${(profile.safeZoneInset * 100).toFixed(1)}%`;
  return {
    "--tv-safe-top": pct,
    "--tv-safe-right": pct,
    "--tv-safe-bottom": pct,
    "--tv-safe-left": pct,
  };
}
