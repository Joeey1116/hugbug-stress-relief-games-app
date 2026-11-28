/**
 * Expo config plugin: with-tvos-spm-signature-fix
 *
 * tvOS archive fix (Nov 28, 2026). Applies ONLY when EXPO_TV=1 (the
 * tvOS workflow's prebuild); a complete no-op for iOS/Android/macOS/
 * web, so every other prebuild's project is byte-for-byte unchanged.
 *
 * WHY: with Firebase resolved through SPM (the RNFB >= 27 default),
 * Xcode stages each binary xcframework's `.signature` provenance file
 * into more than one target's build directory — for absl that is both
 * ${CONFIGURATION_BUILD_DIR}/ (app target) and
 * ${CONFIGURATION_BUILD_DIR}/RNFBFirestore/ (pod target). At archive
 * time Xcode copies every staged copy into the shared
 * <Archive>.xcarchive/Signatures/ folder and the second copy fails:
 *
 *   xcodebuild: error: "absl.xcframework-tvos.signature" couldn't be
 *   copied to "Signatures" because an item with the same name already
 *   exists.                                        (exit code 70)
 *
 * RNFB already ships a workaround for this (firebase_spm.rb's
 * `rnfirebase_fix_spm_archive_signature_collision`): a script phase
 * on the app target that `rm -f`s the TOP-LEVEL staged copy for each
 * known binary artifact, leaving exactly one for the archive to
 * collect. Hugbug's iOS archive passes precisely because of it. But
 * the phase's slice list is hardcoded to iOS —
 * RNFIREBASE_SPM_SIGNATURE_FIX_SLICES = %w[ios ios-simulator] — so on
 * tvOS its rm lines name `*.xcframework-ios.signature` files that
 * never exist, the staged `*.xcframework-tvos.signature` copies are
 * never removed, and the archive collides (tvOS run #2, Nov 28 2026:
 * pod install + 190 targets + bundle + CodeSign + Validate all green,
 * failed at this final step).
 *
 * THE FIX: RNFB's own documented fallback for this error (see the
 * warning text in firebase_spm.rb) is a Run Script phase on the app
 * target removing the staged signature files. This plugin adds that
 * phase at prebuild time — the generation layer, so it survives the
 * tvOS workflow's prebuild regeneration — with the SAME artifact
 * list RNFB enumerates (every .binaryTarget xcframework in the
 * resolved firebase-ios-sdk graph) and the tvOS slice names
 * (`tvos`, `tvos-simulator` for simulator archives). Like RNFB's
 * phase it removes only the top-level ${CONFIGURATION_BUILD_DIR}
 * copy, leaving the per-pod nested copy as the single collected
 * file — the exact arrangement that passes on iOS.
 *
 * Registered AFTER @react-native-tvos/config-tv and
 * ./plugins/with-tvos-signing in app.json; the phase is appended to
 * the app target's build-phase list, in the same late window RNFB's
 * own phase occupies on iOS (pod install appends its phases after
 * this one; no phase between them stages signature files, and the
 * archive's Signatures copy runs after the whole build).
 */
const { withXcodeProject, createRunOncePlugin } = require('@expo/config-plugins');

const PHASE_NAME = '[HUGBUG] Remove duplicate Firebase SPM tvOS xcframework signature files';

// Every .binaryTarget xcframework name in the resolved firebase-ios-sdk
// SPM graph — copied 1:1 from RNFB's
// RNFIREBASE_SPM_SIGNATURE_FIX_ARTIFACT_NAMES (firebase_spm.rb), which
// RNFB enumerated from SourcePackages/workspace-state.json. Keep in
// sync if a future RNFB release extends the list.
const ARTIFACT_NAMES = [
  'GoogleAppMeasurement',
  'GoogleAppMeasurementIdentitySupport',
  'GoogleAdsOnDeviceConversion',
  'FirebaseAnalytics',
  'FirebaseFirestoreInternal',
  'absl',
  'grpc',
  'grpcpp',
  'openssl_grpc',
];

// The slice names RNFB's phase misses: staged signature files are
// named after the archived slice, so a tvOS device archive stages
// `*-tvos.signature` and a simulator archive `*-tvos-simulator.signature`.
const TVOS_SLICES = ['tvos', 'tvos-simulator'];

function buildScript() {
  const lines = ARTIFACT_NAMES.flatMap((name) =>
    TVOS_SLICES.map(
      (slice) => `rm -f "\${CONFIGURATION_BUILD_DIR}"/${name}.xcframework-${slice}.signature`
    )
  );
  // Trailing newline, matching RNFB's generated phase content.
  return `${lines.join('\n')}\n`;
}

const withTvosSpmSignatureFix = (config) => {
  if (process.env.EXPO_TV !== '1' && process.env.EXPO_TV !== 'true') {
    return config;
  }
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const mainTargetUuid = project.getFirstTarget().uuid;
    const target = project.pbxNativeTargetSection()[mainTargetUuid];
    if (!target) return config;

    // Idempotent: a re-run of prebuild over an already-generated
    // project (no --clean) must not stack duplicate phases.
    const scriptSection = project.hash.project.objects.PBXShellScriptBuildPhase || {};
    const alreadyPresent = (target.buildPhases || []).some((phase) => {
      const entry = scriptSection[phase.value];
      return entry && entry.name === `"${PHASE_NAME}"`;
    });
    if (alreadyPresent) return config;

    project.addBuildPhase([], 'PBXShellScriptBuildPhase', PHASE_NAME, mainTargetUuid, {
      shellPath: '/bin/sh',
      shellScript: buildScript(),
      alwaysOutOfDate: true,
    });
    return config;
  });
};

module.exports = createRunOncePlugin(
  withTvosSpmSignatureFix,
  'with-tvos-spm-signature-fix',
  '1.0.0'
);
