/**
 * Expo config plugin: with-tvos-pod-gating
 *
 * tvOS pod gating (Nov 28, 2026). Applies ONLY when EXPO_TV=1 (the
 * tvOS workflow's prebuild); a complete no-op for iOS/Android/macOS/
 * web, so every other prebuild's Podfile is byte-for-byte unchanged.
 *
 * WHY: @react-native-google-signin/google-signin's podspec
 * (RNGoogleSignin) declares ONLY ios — it does not declare tvOS, so
 * `pod install` for the converted tvOS target fails on it. It must be
 * excluded from RN CLI autolinking/codegen for the tvOS install,
 * which react-native.config.js does when it sees
 * HUGBUG_TVOS_POD_INSTALL=1 (the same documented ios:null disable
 * mechanism, and the same env-flag pattern, this repo already uses to
 * exclude react-native-screens from the macOS install via
 * HUGBUG_MACOS_POD_INSTALL in macos/Podfile). Its JS side is stubbed
 * for tvOS bundles in metro.config.js (src/tvos-stubs/), mirroring
 * the macOS stub: Google sign-in is simply unavailable in the TV app.
 *
 * expo-apple-authentication's podspec is likewise ios-only, but it
 * needs NO gate here: it is an Expo module, and Expo's own
 * autolinking (use_expo_modules!) skips any pod whose podspec does
 * not support the target's platform — under the converted
 * `platform :tvos` Podfile it is filtered out automatically (the
 * same reason Flight Journal's tvOS build ships ios-only Expo
 * podspecs without issue). Only its JS side needs the tvOS stub.
 * Every other pod in this app was audited Nov 28, 2026: the Firebase
 * pods (RNFBApp/Auth/Firestore) declare tvos deployment targets,
 * async-storage / gesture-handler / reanimated / worklets /
 * safe-area-context / screens all declare tvOS.
 *
 * The flag has to live IN the generated Podfile: `pod install` is a
 * separate workflow step from `expo prebuild`, and the macOS pattern
 * works precisely because macos/Podfile sets its flag before any
 * tooling runs — every process CocoaPods spawns (the
 * `react-native config` autolinking call and the codegen script)
 * inherits it. This plugin stamps the tvOS equivalent into the
 * generated ios/Podfile at prebuild time, so the gate survives
 * prebuild regeneration. (The tvOS workflow additionally exports
 * EXPO_TV=1 on its pod-install/archive steps; react-native.config.js
 * honors either signal.)
 *
 * Registered AFTER @react-native-tvos/config-tv and
 * ./plugins/with-tvos-signing in app.json; config-tv's own Podfile
 * mod only rewrites the `platform :ios` line, so the stamped ENV
 * line at the top of the file is preserved.
 *
 * Mirrors the BeaTrackFam main app's with-tvos-pod-gating
 * (commit c30d80b), which gates its ios-only RN pods the same way.
 */
const {
  withPodfile,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const FLAG_LINE = "ENV['HUGBUG_TVOS_POD_INSTALL'] = '1'";

const withTvosPodGating = (config) => {
  if (process.env.EXPO_TV !== '1' && process.env.EXPO_TV !== 'true') {
    return config;
  }
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes('HUGBUG_TVOS_POD_INSTALL')) {
      config.modResults.contents = `${FLAG_LINE}\n\n${config.modResults.contents}`;
    }
    return config;
  });
};

module.exports = createRunOncePlugin(withTvosPodGating, 'with-tvos-pod-gating', '1.0.0');
