// React Native CLI / codegen config.
//
// Default (every normal invocation — iOS, Android, web, Metro, Expo
// autolinking): EMPTY. Nothing below changes any existing build.
//
// Two gated exceptions, both following the same mechanism (setting a
// library's `ios` platform config to null — the RN CLI's documented
// disable mechanism — which drops it from Apple-platform autolinking
// and codegen for that install only):
//
// 1. macOS: the macOS target's `pod install`. macos/Podfile sets
//    HUGBUG_MACOS_POD_INSTALL=1 before any tooling runs, and that
//    environment variable is inherited by every process CocoaPods
//    spawns (the `react-native config` autolinking call and the
//    codegen script). Only then does the override below apply. The
//    iOS Podfile never sets the variable, so iOS codegen and
//    autolinking see exactly the empty config — every library below
//    stays fully linked and code-generated on iOS/Android.
//
//    WHY THE MACOS OVERRIDE EXISTS (macOS rollout, Nov 27, 2026):
//    The Mac target builds with react-native-macos 0.83, whose codegen
//    parser predates syntax that newer libraries' Fabric specs use.
//    Codegen runs during `pod install` and aborts on an unparseable
//    spec, killing the whole install. Separately, react-native-screens'
//    podspec declares only ios/tvos/visionos — it can never link into a
//    macOS target (CocoaPods autolinking already skips it for this
//    target), and the Mac UI never renders screens' native components
//    (sidebar + <Slot /> layout; the Metro config stubs its JS-side
//    native components for macos bundles).
//    So for the Mac build — and only the Mac build — each library in
//    MACOS_CODEGEN_EXCLUSIONS is excluded from Apple-platform
//    autolinking/codegen. The macOS codegen run is invoked with the
//    ios target platform (react-native-macos reuses the iOS codegen
//    path), and its executor drops any library whose platforms.ios is
//    null from codegen generation.
//
//    The exclusion list is verified by the faithful local codegen
//    simulation (react-native-macos 0.83's
//    scripts/generate-codegen-artifacts.js, target platform ios, with
//    HUGBUG_MACOS_POD_INSTALL=1): every library listed here either
//    has no macOS podspec platform or its specs fail the 0.83 parser;
//    every library NOT listed passes that simulation (exit 0).
//
//      - react-native-screens: podspec has no macOS platform, and its
//        4.26 Fabric specs use syntax the 0.83 parser rejects (e.g.
//        `React.ComponentRef<...>` in the gamma stack-header spec).
//      - FBReactNativeSpec: the codegen library name shared by the
//        app's react-native 0.86 core specs. 0.86's core sources include
//        the new VirtualView spec, whose `onModeChange` event the 0.83
//        parser cannot determine arguments for, aborting the run. This
//        is also the WRONG core spec set for the Mac target: the fork
//        ships its own FBReactNativeSpec under
//        react-native-macos/React/FBReactNativeSpec, consumed by the
//        Mac target via the React-RCTFBReactNativeSpec pod in the
//        fork's react_native_pods.rb — app-level codegen generation of
//        the core spec is skipped by the executor when it already
//        exists. Excluding the 0.86 copy from the library list loses
//        nothing on macOS.
//
// 2. tvOS: the tvOS target's `pod install`. The generated tvOS
//    Podfile carries HUGBUG_TVOS_POD_INSTALL=1 (stamped in by
//    plugins/with-tvos-pod-gating.js during the EXPO_TV=1 prebuild;
//    the tvOS workflow also exports EXPO_TV=1 on its pod-install and
//    archive steps, and either signal activates this gate). Only then
//    is @react-native-google-signin/google-signin excluded: its
//    podspec (RNGoogleSignin) declares ONLY ios, so CocoaPods refuses
//    to install it into a tvOS target ("The platform of the target
//    ... is not compatible"). Its JS side is stubbed for tvOS bundles
//    in metro.config.js (src/tvos-stubs/), mirroring the macOS stub:
//    Google sign-in is unavailable in the TV app, while Firebase
//    email auth — whose pods declare tvOS — keeps working natively.
//    expo-apple-authentication's podspec is likewise ios-only but
//    needs no gate here: Expo's own autolinking (use_expo_modules!)
//    skips pods whose podspec doesn't support the target platform,
//    so it is filtered out of the tvOS install automatically; only
//    its JS side is stubbed. Every other pod was audited Nov 28,
//    2026: Firebase (app/auth/firestore), async-storage,
//    gesture-handler, reanimated, worklets, safe-area-context and
//    screens all declare tvOS. (tvOS gating, Nov 28, 2026 — mirrors
//    the BeaTrackFam main app's tvOS pod gating, commit c30d80b.)
//
// The iOS Podfile sets neither variable and EXPO_TV is unset for
// every non-tvOS build, so iOS/Android codegen and autolinking see
// exactly the empty/default config — every library stays fully
// linked and code-generated there.
const MACOS_CODEGEN_EXCLUSIONS = [
  'react-native-screens',
  'FBReactNativeSpec',
];

const TVOS_POD_EXCLUSIONS = ['@react-native-google-signin/google-signin'];

const isMacosPodInstall =
  process.env.HUGBUG_MACOS_POD_INSTALL === '1';
const isTvosPodInstall =
  process.env.HUGBUG_TVOS_POD_INSTALL === '1' ||
  process.env.EXPO_TV === '1' ||
  process.env.EXPO_TV === 'true';

const dependencies = {};

if (isMacosPodInstall) {
  for (const name of MACOS_CODEGEN_EXCLUSIONS) {
    dependencies[name] = { platforms: { ios: null } };
  }
}

if (isTvosPodInstall) {
  for (const name of TVOS_POD_EXCLUSIONS) {
    dependencies[name] = { platforms: { ios: null } };
  }
}

module.exports =
  Object.keys(dependencies).length > 0 ? { dependencies } : {};
