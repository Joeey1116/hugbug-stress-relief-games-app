/**
 * App Tracking Transparency.
 *
 * The ATT prompt fires on first launch per Apple's requirement.
 * The app has no ads and no third-party tracking SDKs — the IDFA
 * is not used for cross-app tracking.
 *
 * Crash-safety: expo-tracking-transparency is NEVER statically imported.
 * It is loaded lazily with a dynamic import inside try/catch, so a
 * missing native module (web preview, old build) can never throw at
 * module evaluation on the launch path. (Hit Nov 7, 2026: the static
 * import redboxed the web preview at startup with "Cannot find native
 * module 'ExpoTrackingTransparency'" — the same rule as notifications.)
 */
const TRACKING_ENABLED = true;

export async function maybeRequestTracking(): Promise<boolean> {
  if (!TRACKING_ENABLED) return false;
  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    const { status } = await requestTrackingPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
