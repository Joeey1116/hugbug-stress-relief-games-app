/**
 * expo-apple-authentication stub for tvOS bundles ONLY (wired up in
 * metro.config.js; iOS/Android/macOS resolve their own module —
 * macOS uses src/macos-stubs/).
 *
 * Apple Sign In via expo-apple-authentication has an ios-only
 * podspec; Expo's autolinking filters it out of the tvOS install, so
 * the native module does not exist on Apple TV. The sign-in/sign-up
 * screens and lib/auth.tsx load it with a dynamic import inside
 * try/catch, and signInAsync rejecting here surfaces as their normal
 * "Apple sign-in failed" path — no session is ever fabricated on TV.
 */

export enum AppleAuthenticationScope {
  FULL_NAME = 0,
  EMAIL = 1,
}

export async function isAvailableAsync(): Promise<boolean> {
  return false;
}

export async function signInAsync(): Promise<never> {
  throw new Error('Apple sign-in is not available in the TV app yet.');
}

export default { AppleAuthenticationScope, isAvailableAsync, signInAsync };
