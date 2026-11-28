// Metro config — Expo defaults, plus a macOS-only resolver shim for the
// react-native-macos target (see macos/ and .github/workflows/macos-build.yml).
//
// WHY THIS FILE EXISTS: until now the project had no metro.config.js and
// Expo used its built-in defaults. This file calls getDefaultConfig(),
// which IS those defaults (SDK 57's default resolver platforms already
// include 'macos', so .macos.ts/.macos.tsx variants resolve with no
// further config). The only addition is a resolveRequest wrapper that
// activates EXCLUSIVELY for platform === 'macos' bundles:
//
//   - 'react-native' (and its subpaths) resolve to 'react-native-macos',
//     the standard react-native-macos metro mapping. react-native-macos
//     is a fork of RN 0.83 while the app runs RN 0.86 on ios/android —
//     see the version-mismatch note in the macOS workflow header.
//   - The Firebase / sign-in modules in MACOS_MODULE_STUBS resolve to
//     local inert stubs: React Native Firebase, Google Sign-In and
//     expo-apple-authentication have no react-native-macos builds.
//     The stubs keep the app in its signed-out state on Mac (auth
//     attempts reject with a clear message; Firestore writes are
//     no-ops — every call site already treats them as best-effort
//     with the AsyncStorage cache as source of truth).
//
//   - For tvOS bundles (platform === 'tvos'), the two modules in
//     TVOS_MODULE_STUBS resolve to the tvOS stubs under
//     src/tvos-stubs/ — see TVOS_MODULE_STUBS below.
//
// iOS / Android / web bundles pass through to Expo's resolver untouched.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const MACOS_MODULE_STUBS = {
  '@react-native-firebase/app': path.resolve(__dirname, 'src/macos-stubs/firebase-app.ts'),
  '@react-native-firebase/auth': path.resolve(__dirname, 'src/macos-stubs/firebase-auth.ts'),
  '@react-native-firebase/firestore': path.resolve(
    __dirname,
    'src/macos-stubs/firebase-firestore.ts',
  ),
  '@react-native-google-signin/google-signin': path.resolve(
    __dirname,
    'src/macos-stubs/google-signin.ts',
  ),
  'expo-apple-authentication': path.resolve(
    __dirname,
    'src/macos-stubs/expo-apple-authentication.ts',
  ),
};

// tvOS bundles (Nov 28, 2026): Google Sign-In's podspec declares
// only ios, so react-native.config.js gates the pod out of the tvOS
// install; expo-apple-authentication's podspec is likewise ios-only
// and Expo autolinking filters it out of the tvOS install. Neither
// native module exists on Apple TV, so their JS sides resolve to
// these inert stubs — the same signed-out behavior as the macOS
// stubs, with Firebase email auth (whose pods declare tvOS) still
// working natively.
const TVOS_MODULE_STUBS = {
  '@react-native-google-signin/google-signin': path.resolve(
    __dirname,
    'src/tvos-stubs/google-signin.ts',
  ),
  'expo-apple-authentication': path.resolve(
    __dirname,
    'src/tvos-stubs/expo-apple-authentication.ts',
  ),
};

const upstreamResolveRequest =
  typeof config.resolver.resolveRequest === 'function'
    ? config.resolver.resolveRequest
    : null;

const resolveDefault = (context, moduleName, platform) =>
  upstreamResolveRequest
    ? upstreamResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);

const RNSCREENS_MACOS_STUB = path.resolve(
  __dirname,
  'src/macos-stubs/rnscreens-tabs.tsx',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'tvos') {
    if (Object.prototype.hasOwnProperty.call(TVOS_MODULE_STUBS, moduleName)) {
      return { type: 'sourceFile', filePath: TVOS_MODULE_STUBS[moduleName] };
    }
    return resolveDefault(context, moduleName, platform);
  }
  if (platform === 'macos') {
    if (moduleName === 'react-native') {
      return context.resolveRequest(context, 'react-native-macos', platform);
    }
    if (moduleName.startsWith('react-native/')) {
      return context.resolveRequest(
        context,
        `react-native-macos/${moduleName.slice('react-native/'.length)}`,
        platform,
      );
    }
    if (Object.prototype.hasOwnProperty.call(MACOS_MODULE_STUBS, moduleName)) {
      return { type: 'sourceFile', filePath: MACOS_MODULE_STUBS[moduleName] };
    }
    try {
      return resolveDefault(context, moduleName, platform);
    } catch (e) {
      // react-native-screens ships a tail of native components
      // (native-tabs host/screen, the experimental "gamma" stack
      // header, …) for ios/android/web only — no .macos or .native
      // file exists, so resolution can NEVER succeed for them on
      // macOS. They are all native view components the macOS build
      // never renders (the macOS layout is a sidebar + <Slot />), so
      // an inert component stub is the correct resolution.
      if (context.originModulePath.includes('react-native-screens/')) {
        return { type: 'sourceFile', filePath: RNSCREENS_MACOS_STUB };
      }
      throw e;
    }
  }
  return resolveDefault(context, moduleName, platform);
};

module.exports = config;
