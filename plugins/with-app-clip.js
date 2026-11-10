/**
 * with-app-clip — Expo config plugin for Hugbug.
 *
 * Adds a native App Clip target ("HugbugClip", bundle ID
 * com.beatrackfaminc.hugbug.HugBug) to the iOS project during
 * `expo prebuild`, so it survives regeneration of ios/ (hand-editing the
 * Xcode project would be wiped on the next build).
 *
 * WHY NATIVE, NOT THE REACT NATIVE APP: an App Clip must stay under
 * 15 MB, and the full app's React Native / Hermes runtime alone would
 * blow that budget. The clip is therefore a tiny native SwiftUI
 * experience — the app's breathing anchor (Calm 4-4 and Box 4-4-4-4,
 * the same rhythms as components/BreathingSession.tsx) — plus a link
 * to the full Hugbug app. No JS bundle, no pods, no network calls.
 *
 * WHAT IT DOES (single withXcodeProject mod, so ordering is safe):
 *   1. Writes the clip sources under ios/HugbugClip/:
 *        HugbugClipApp.swift            — SwiftUI breathing experience
 *        HugbugClip-Info.plist         — clip Info.plist
 *        HugbugClip.entitlements       — on-demand-install-capable +
 *                                        parent-application-identifiers +
 *                                        associated-domains
 *                                        (applinks:beatrackfam.info,
 *                                        CLIP ONLY — the parent app never
 *                                        gets associated-appclip-app-
 *                                        identifiers; declaring it breaks
 *                                        the archive)
 *        Assets.xcassets/              — AppIcon (copied from
 *                                        assets/icon.png)
 *   2. Creates the HugbugClip native target. The `xcode` library
 *      (4.0.0) has no app_clip target type, so the target is created
 *      as an "application" target via project.addTarget() and then
 *      patched to the real App Clip product type
 *      com.apple.product-type.application.on-demand-install-capable
 *      with a .appclip product (wrapper.app-clip).
 *   3. Adds Sources / Resources / Frameworks phases to the clip and
 *      its Swift + asset-catalog files to them.
 *   4. Adds an "Embed App Clips" copy-files phase (dstSubfolderSpec 16
 *      = products directory, the value Xcode writes) to the main
 *      target, so `xcodebuild archive -scheme <main>` builds the clip
 *      and embeds it in the app bundle. The phase carries the
 *      EXPLICIT dstPath $(CONTENTS_FOLDER_PATH)/AppClips — the
 *      dstPath "" form generated a phase Xcode never executed
 *      (Rewards 2.0.0 archives, Nov 10 2026: clip built, never
 *      embedded, ASC said HAS APP CLIP: NO). The main target already
 *      depends on the clip (addTarget wires that), so the clip builds
 *      first.
 *   5. Sets per-target provisioning (the workflow used to pass
 *      PROVISIONING_PROFILE_SPECIFIER on the xcodebuild command line,
 *      which overrides EVERY target — the clip would then try to sign
 *      with the main app's profile and fail):
 *        main target -> "HugBug App"       (same profile as before)
 *        clip target -> "HugBug App Clip"  (Joey creates this in the
 *                                           Developer portal; the
 *                                           workflow's
 *                                           -allowProvisioningUpdates
 *                                           fetches it once it exists)
 *      The workflow's archive step drops the global specifier; the
 *      signing identity (Nov 6 Apple Distribution cert) is still
 *      passed globally and applies to both targets.
 *   6. Adds the clip to the main scheme's BuildAction (archiving YES)
 *      so the archive includes it.
 *
 * AUDIT NOTES (Nov 10, 2026 — checked against the proven App Clip
 * fixes in AGENTS.md, mirroring the main app's plugin):
 *   - Clip UIDeviceFamily "1,2" = parent's (Universal); iPhone-only
 *     fails ValidateEmbeddedBinary. Clip Info.plist carries
 *     UISupportedInterfaceOrientations~ipad (all four) + UILaunchScreen
 *     for the universal clip.
 *   - Clip icon set = a single universal-1024 Contents.json entry.
 *   - The clip's PBXGroup carries path = HugbugClip, so file refs
 *     added with the full relative path resolve DOUBLED
 *     (HugbugClip/HugbugClip/…) — the refs are patched to bare
 *     basenames after each add (same fix as the main app plugin).
 *   - addResourceFile is kept (xcode 4.0.0 guards the null Resources
 *     group — correctForPath no-ops when the group is absent — and the
 *     generated project proves it runs here); only its path is patched.
 *   - The clip is pure SwiftUI: no React Native, no AppDelegate, no
 *     pods, no bundle script in the clip target.
 *
 * PORTAL PREREQUISITES (Joey, before the first clip build):
 *   - Developer portal: App ID com.beatrackfaminc.hugbug.HugBug
 *     ("HugBug App Clip") — ALREADY EXISTS (verified from Joey's
 *     portal screenshots, Nov 10).
 *   - Developer portal: Distribution provisioning profile named
 *     exactly "HugBug App Clip" for that App ID, including the
 *     current Apple Distribution certificate (the Nov 6 one).
 *     STATUS UNCONFIRMED — Joey is checking the Profiles tab; if
 *     no such profile exists yet, create it with exactly that name
 *     (the workflow references it by name). The workflow's
 *     -allowProvisioningUpdates fetches it once it exists.
 *   No separate App Store Connect app record is needed for the clip —
 *   it ships inside the parent app's build.
 */
const { withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CLIP_TARGET_NAME = 'HugbugClip';
const CLIP_BUNDLE_ID = 'com.beatrackfaminc.hugbug.HugBug';
const MAIN_BUNDLE_ID = 'com.beatrackfaminc.hugbug';
const MAIN_PROFILE = 'HugBug App';
const CLIP_PROFILE = 'HugBug App Clip';
const CLIP_PRODUCT_TYPE = 'com.apple.product-type.application.on-demand-install-capable';

const CLIP_APP_SWIFT = `import SwiftUI

/// Hugbug App Clip — a tiny native SwiftUI breathing moment.
///
/// Deliberately NOT the React Native app: an App Clip must stay under
/// 15 MB, and the full app's JS runtime alone would blow that budget.
/// This clip is the calm breathing anchor from the app — the same
/// Calm 4-4 and Box 4-4-4-4 rhythms as BreathingSession — plus a
/// link to the full Hugbug app. No timers. No losing. No ads.
@main
struct HugbugClipApp: App {
  var body: some Scene {
    WindowGroup {
      ClipBreathingView()
    }
  }
}

private struct Phase {
  let label: String
  let seconds: Int
  /// True while the circle should be growing (inhale / hold).
  let grows: Bool
}

private struct Pattern {
  let id: String
  let label: String
  let phases: [Phase]
}

private let patterns: [Pattern] = [
  Pattern(id: "calm", label: "Calm 4 · 4", phases: [
    Phase(label: "Breathe in", seconds: 4, grows: true),
    Phase(label: "Breathe out", seconds: 4, grows: false),
  ]),
  Pattern(id: "box", label: "Box 4 · 4 · 4 · 4", phases: [
    Phase(label: "Breathe in", seconds: 4, grows: true),
    Phase(label: "Hold", seconds: 4, grows: true),
    Phase(label: "Breathe out", seconds: 4, grows: false),
    Phase(label: "Rest", seconds: 4, grows: false),
  ]),
]

private let bg = Color(red: 11 / 255, green: 17 / 255, blue: 32 / 255)
private let accent = Color(red: 143 / 255, green: 216 / 255, blue: 181 / 255)
private let accentSoft = Color(red: 143 / 255, green: 216 / 255, blue: 181 / 255, opacity: 0.16)
private let muted = Color(red: 138 / 255, green: 147 / 255, blue: 168 / 255)

struct ClipBreathingView: View {
  @State private var patternId = "calm"
  @State private var running = false
  @State private var phaseIndex = 0
  @State private var cycles = 0
  @State private var scale: CGFloat = 1
  @State private var sessionTask: Task<Void, Never>?

  private var pattern: Pattern {
    patterns.first { $0.id == patternId } ?? patterns[0]
  }
  private var phase: Phase { pattern.phases[phaseIndex] }

  var body: some View {
    ZStack {
      bg.ignoresSafeArea()
      VStack(spacing: 0) {
        Text("HUGBUG")
          .font(.system(size: 28, weight: .heavy))
          .tracking(8)
          .foregroundColor(.white)
          .padding(.top, 48)
        Text("STRESS RELIEF GAMES")
          .font(.system(size: 12, weight: .heavy))
          .tracking(4)
          .foregroundColor(muted)
          .padding(.top, 6)
        Text("No timers. No losing. No ads.")
          .font(.system(size: 14))
          .italic()
          .foregroundColor(muted.opacity(0.8))
          .padding(.top, 12)

        HStack(spacing: 8) {
          ForEach(patterns, id: \\.id) { p in
            Button {
              guard !running else { return }
              patternId = p.id
              phaseIndex = 0
            } label: {
              Text(p.label)
                .font(.system(size: 14, weight: .bold))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(patternId == p.id ? accentSoft : Color.white.opacity(0.06))
                .foregroundColor(patternId == p.id ? accent : muted)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 1))
            }
            .disabled(running)
          }
        }
        .padding(.top, 28)

        ZStack {
          Circle()
            .fill(accentSoft)
            .frame(width: 170, height: 170)
            .overlay(Circle().stroke(accent.opacity(0.55), lineWidth: 2))
            .scaleEffect(scale)
          VStack(spacing: 4) {
            Text(running ? phase.label : "Ready when you are")
              .font(.system(size: 18, weight: .bold))
              .foregroundColor(.white)
              .multilineTextAlignment(.center)
              .padding(.horizontal, 12)
            if running {
              Text("\\(phase.seconds)s")
                .font(.system(size: 14))
                .foregroundColor(muted)
            }
          }
        }
        .frame(height: 260)
        .padding(.top, 8)

        Text(running ? "Quiet breath \\(cycles + 1) · no rush" : "Pick a rhythm, then just follow the circle.")
          .font(.system(size: 14))
          .foregroundColor(muted)
          .multilineTextAlignment(.center)
          .padding(.bottom, 24)

        Button(running ? "PAUSE" : "BEGIN") {
          running ? stop() : start()
        }
        .font(.system(size: 16, weight: .heavy))
        .tracking(2)
        .padding(.horizontal, 48)
        .padding(.vertical, 16)
        .background(running ? Color.white.opacity(0.16) : accent)
        .foregroundColor(running ? .white : Color(red: 11 / 255, green: 17 / 255, blue: 32 / 255))
        .clipShape(Capsule())

        Spacer()

        Link("Get the full Hugbug app — 10 calm games", destination: URL(string: "https://beatrackfam.info")!)
          .font(.system(size: 14, weight: .bold))
          .foregroundColor(accent)
          .padding(.bottom, 8)
        Text("A little calm from Hugbug.")
          .font(.system(size: 12))
          .foregroundColor(muted)
          .padding(.bottom, 32)
      }
      .padding(.horizontal, 32)
    }
  }

  private func start() {
    running = true
    cycles = 0
    phaseIndex = 0
    sessionTask = Task {
      var cycle = 0
      var idx = 0
      while !Task.isCancelled {
        let p = pattern.phases[idx]
        await MainActor.run {
          phaseIndex = idx
          withAnimation(.easeInOut(duration: Double(p.seconds))) {
            scale = p.grows ? 1.55 : 1.0
          }
        }
        try? await Task.sleep(nanoseconds: UInt64(p.seconds) * 1_000_000_000)
        if Task.isCancelled { break }
        idx += 1
        if idx >= pattern.phases.count {
          idx = 0
          cycle += 1
          await MainActor.run { cycles = cycle }
        }
      }
    }
  }

  private func stop() {
    sessionTask?.cancel()
    sessionTask = nil
    running = false
    phaseIndex = 0
    withAnimation(.easeInOut(duration: 0.6)) { scale = 1.0 }
  }
}
`;

const CLIP_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>CFBundleDevelopmentRegion</key>
\t<string>en</string>
\t<key>CFBundleDisplayName</key>
\t<string>Hugbug</string>
\t<key>CFBundleExecutable</key>
\t<string>$(EXECUTABLE_NAME)</string>
\t<key>CFBundleIdentifier</key>
\t<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
\t<key>CFBundleInfoDictionaryVersion</key>
\t<string>6.0</string>
\t<key>CFBundleName</key>
\t<string>$(PRODUCT_NAME)</string>
\t<key>CFBundlePackageType</key>
\t<string>APPL</string>
\t<key>CFBundleShortVersionString</key>
\t<string>$(MARKETING_VERSION)</string>
\t<key>CFBundleVersion</key>
\t<string>$(CURRENT_PROJECT_VERSION)</string>
\t<key>ITSAppUsesNonExemptEncryption</key>
\t<false/>
\t<key>LSRequiresIPhoneOS</key>
\t<true/>
\t<key>UIRequiredDeviceCapabilities</key>
\t<array>
\t\t<string>armv7</string>
\t</array>
\t<key>UISupportedInterfaceOrientations</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t</array>
\t<key>UISupportedInterfaceOrientations~ipad</key>
\t<array>
\t\t<string>UIInterfaceOrientationPortrait</string>
\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>
\t\t<string>UIInterfaceOrientationLandscapeLeft</string>
\t\t<string>UIInterfaceOrientationLandscapeRight</string>
\t</array>
\t<key>UILaunchScreen</key>
\t<dict/>
</dict>
</plist>
`;

const CLIP_ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.on-demand-install-capable</key>
\t<true/>
\t<key>com.apple.developer.parent-application-identifiers</key>
\t<array>
\t\t<string>${MAIN_BUNDLE_ID}</string>
\t</array>
\t<key>com.apple.developer.associated-domains</key>
\t<array>
\t\t<string>applinks:beatrackfam.info</string>
\t\t<string>appclips:beatrackfam.info</string>
\t</array>
</dict>
</plist>
`;

const ASSETS_CONTENTS = `{
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`;

const APPICON_CONTENTS = `{
  "images" : [
    {
      "filename" : "App-Icon-1024x1024@1x.png",
      "idiom" : "universal",
      "platform" : "ios",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
`;

function writeClipFiles(iosRoot, projectRoot) {
  const clipDir = path.join(iosRoot, CLIP_TARGET_NAME);
  const iconSetDir = path.join(clipDir, 'Assets.xcassets', 'AppIcon.appiconset');
  fs.mkdirSync(iconSetDir, { recursive: true });
  fs.writeFileSync(path.join(clipDir, `${CLIP_TARGET_NAME}App.swift`), CLIP_APP_SWIFT);
  fs.writeFileSync(path.join(clipDir, `${CLIP_TARGET_NAME}-Info.plist`), CLIP_INFO_PLIST);
  fs.writeFileSync(path.join(clipDir, `${CLIP_TARGET_NAME}.entitlements`), CLIP_ENTITLEMENTS);
  fs.writeFileSync(path.join(clipDir, 'Assets.xcassets', 'Contents.json'), ASSETS_CONTENTS);
  fs.writeFileSync(path.join(iconSetDir, 'Contents.json'), APPICON_CONTENTS);
  const iconSrc = path.join(projectRoot, 'assets', 'icon.png');
  if (!fs.existsSync(iconSrc)) {
    throw new Error('[with-app-clip] Missing assets/icon.png — needed for the clip AppIcon.');
  }
  fs.copyFileSync(iconSrc, path.join(iconSetDir, 'App-Icon-1024x1024@1x.png'));
}

function forEachTargetConfig(project, targetUuid, fn) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  const listUuid = target.buildConfigurationList;
  const list = project.pbxXCConfigurationList()[listUuid];
  const configs = project.pbxXCBuildConfigurationSection();
  for (const entry of list.buildConfigurations) {
    fn(configs[entry.value], entry.value);
  }
}

function withAppClip(config) {
  return withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const iosRoot = config.modRequest.platformProjectRoot;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = (config.modRequest.projectName || config.name || 'App').replace(
      /[^a-zA-Z0-9]/g,
      '',
    );

    // 1. Clip sources on disk (idempotent — overwritten every prebuild).
    writeClipFiles(iosRoot, projectRoot);

    const mainTarget = project.getFirstTarget();
    const mainTargetUuid = mainTarget.uuid;
    const deploymentTarget = (config.ios && config.ios.deploymentTarget) || '16.4';
    const marketingVersion = config.version || '1.0.0';
    const buildNumber = (config.ios && config.ios.buildNumber) || '1';

    // Main target keeps its exact profile — moved from the workflow's
    // command-line flag into the target so the clip can have its own.
    forEachTargetConfig(project, mainTargetUuid, (cfg) => {
      cfg.buildSettings.PROVISIONING_PROFILE_SPECIFIER = `"${MAIN_PROFILE}"`;
    });

    // Idempotent: a re-run prebuild without --clean finds the target.
    if (project.pbxTargetByName(CLIP_TARGET_NAME)) {
      addClipToScheme(iosRoot, projectName, findClipTargetUuid(project));
      return config;
    }

    // 2. Create the target (as "application" — the xcode lib has no
    // app_clip type) and patch it into a real App Clip target.
    const clip = project.addTarget(CLIP_TARGET_NAME, 'application', CLIP_TARGET_NAME, CLIP_BUNDLE_ID);
    const clipUuid = clip.uuid;
    const clipTarget = project.pbxNativeTargetSection()[clipUuid];
    clipTarget.productType = `"${CLIP_PRODUCT_TYPE}"`;
    clipTarget.name = CLIP_TARGET_NAME;
    clipTarget.productName = CLIP_TARGET_NAME;
    project.pbxNativeTargetSection()[`${clipUuid}_comment`] = CLIP_TARGET_NAME;

    // Product file: HugbugClip.app -> HugbugClip.appclip.
    const productRefUuid = clipTarget.productReference;
    const fileRefs = project.pbxFileReferenceSection();
    fileRefs[productRefUuid].explicitFileType = 'wrapper.app-clip';
    fileRefs[productRefUuid].path = `${CLIP_TARGET_NAME}.appclip`;
    fileRefs[productRefUuid].name = `${CLIP_TARGET_NAME}.appclip`;
    fileRefs[`${productRefUuid}_comment`] = `${CLIP_TARGET_NAME}.appclip`;
    const productsGroup = project.pbxGroupByName('Products');
    if (productsGroup) {
      for (const child of productsGroup.children) {
        if (child.value === productRefUuid) child.comment = `${CLIP_TARGET_NAME}.appclip`;
      }
    }
    const buildFiles = project.pbxBuildFileSection();
    for (const key of Object.keys(buildFiles)) {
      if (key.endsWith('_comment')) continue;
      if (buildFiles[key].fileRef === productRefUuid) {
        buildFiles[key].fileRef_comment = `${CLIP_TARGET_NAME}.appclip`;
        // The writer prints the section comment key, not fileRef_comment.
        buildFiles[`${key}_comment`] = `${CLIP_TARGET_NAME}.appclip in Embed App Clips`;
      }
    }

    // 3. Clip build settings (both Debug and Release).
    forEachTargetConfig(project, clipUuid, (cfg) => {
      const s = cfg.buildSettings;
      s.ASSETCATALOG_COMPILER_APPICON_NAME = 'AppIcon';
      s.CLANG_ENABLE_MODULES = 'YES';
      s.CODE_SIGN_ENTITLEMENTS = `${CLIP_TARGET_NAME}/${CLIP_TARGET_NAME}.entitlements`;
      s.CODE_SIGN_STYLE = 'Manual';
      s.CURRENT_PROJECT_VERSION = buildNumber;
      s.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      s.MARKETING_VERSION = marketingVersion;
      s.PRODUCT_BUNDLE_IDENTIFIER = `"${CLIP_BUNDLE_ID}"`;
      s.PROVISIONING_PROFILE_SPECIFIER = `"${CLIP_PROFILE}"`;
      s.SWIFT_VERSION = '5.0';
      s.TARGETED_DEVICE_FAMILY = '"1,2"';
      s.VERSIONING_SYSTEM = '"apple-generic"';
    });
    project.addTargetAttribute('ProvisioningStyle', 'Manual', clip);
    project.addTargetAttribute('LastSwiftMigration', '1250', clip);

    // 4. Clip group + files + build phases.
    const clipGroupKey = project.pbxCreateGroup(CLIP_TARGET_NAME, CLIP_TARGET_NAME);
    project.getPBXGroupByKey(clipGroupKey).isa = 'PBXGroup';
    const mainGroupKey = project.getFirstProject().firstProject.mainGroup;
    const mainGroup = project.getPBXGroupByKey(mainGroupKey);
    if (mainGroup && !mainGroup.children.some((c) => c.value === clipGroupKey)) {
      mainGroup.children.push({ value: clipGroupKey, comment: CLIP_TARGET_NAME });
    }
    project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', clipUuid);
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', clipUuid);
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', clipUuid);
    // addSourceFile / addResourceFile / addFile store the full relative
    // path, but the clip's PBXGroup already carries path = HugbugClip,
    // so the full path resolves DOUBLED (HugbugClip/HugbugClip/…) and
    // Xcode can't find the files (same bug as the main app plugin,
    // fixed there Nov 10 2026). Patch each ref to a bare basename.
    const clipFiles = [
      project.addSourceFile(`${CLIP_TARGET_NAME}/${CLIP_TARGET_NAME}App.swift`, { target: clipUuid }, clipGroupKey),
      project.addResourceFile(`${CLIP_TARGET_NAME}/Assets.xcassets`, { target: clipUuid }, clipGroupKey),
      project.addFile(`${CLIP_TARGET_NAME}/${CLIP_TARGET_NAME}-Info.plist`, clipGroupKey),
      project.addFile(`${CLIP_TARGET_NAME}/${CLIP_TARGET_NAME}.entitlements`, clipGroupKey, {
        lastKnownFileType: 'text.plist.xml',
      }),
    ];
    for (const f of clipFiles) {
      if (f && f.fileRef) {
        const ref = project.hash.project.objects.PBXFileReference &&
          project.hash.project.objects.PBXFileReference[f.fileRef];
        if (ref) ref.path = `"${f.basename}"`;
      }
    }

    // 5. Embed the clip in the main app. 'watch2_app' here only selects
    // the products_directory destination (dstSubfolderSpec 16) — the
    // exact value Xcode writes for "Embed App Clips". The dstPath MUST
    // be explicit: the dstPath "" form generated a phase Xcode never
    // executed (Rewards 2.0.0 archives, Nov 10 2026 — clip built, never
    // embedded, ASC said HAS APP CLIP: NO). The explicit
    // $(CONTENTS_FOLDER_PATH)/AppClips destination is the form that
    // actually runs.
    const embed = project.addBuildPhase(
      [`${CLIP_TARGET_NAME}.appclip`],
      'PBXCopyFilesBuildPhase',
      'Embed App Clips',
      mainTargetUuid,
      'watch2_app',
      '"$(CONTENTS_FOLDER_PATH)/AppClips"',
    );
    embed.buildPhase.dstSubfolderSpec = 16;
    // addBuildPhase builds the phase-entry comment from the product
    // file's group ("Copy Files"); correct it to the phase name.
    for (const f of embed.buildPhase.files) {
      if (f.value && buildFiles[f.value]) {
        f.comment = `${CLIP_TARGET_NAME}.appclip in Embed App Clips`;
      }
    }

    // Explicit main -> clip target dependency. The xcode lib's
    // addTargetDependency silently no-ops when the project has no
    // PBXTargetDependency / PBXContainerItemProxy section yet (a fresh
    // prebuild has neither), so wire it by hand.
    addTargetDependency(project, mainTargetUuid, clipUuid);

    // Tidy the targets-list comment addTarget left quoted.
    const projectObj = project.getFirstProject().firstProject;
    for (const t of projectObj.targets) {
      if (t.value === clipUuid) t.comment = CLIP_TARGET_NAME;
    }

    // 6. Scheme: build the clip when archiving the main scheme.
    addClipToScheme(iosRoot, projectName, clipUuid);

    // The xcode lib writes `= undefined` literals for file-reference
    // keys it leaves unset (fileEncoding / lastKnownFileType /
    // explicitFileType) — strip them so the pbxproj matches what
    // Xcode itself writes.
    stripUndefined(project.hash.project.objects);

    return config;
  });
}

function addTargetDependency(project, targetUuid, dependencyUuid) {
  const objects = project.hash.project.objects;
  if (!objects.PBXTargetDependency) objects.PBXTargetDependency = {};
  if (!objects.PBXContainerItemProxy) objects.PBXContainerItemProxy = {};
  const depUuid = project.generateUuid();
  const proxyUuid = project.generateUuid();
  const rootObject = project.hash.project.rootObject;
  objects.PBXContainerItemProxy[proxyUuid] = {
    isa: 'PBXContainerItemProxy',
    containerPortal: rootObject,
    containerPortal_comment: project.hash.project.rootObject_comment,
    proxyType: 1,
    remoteGlobalIDString: dependencyUuid,
    remoteInfo: CLIP_TARGET_NAME,
  };
  objects.PBXContainerItemProxy[`${proxyUuid}_comment`] = 'PBXContainerItemProxy';
  objects.PBXTargetDependency[depUuid] = {
    isa: 'PBXTargetDependency',
    target: dependencyUuid,
    target_comment: CLIP_TARGET_NAME,
    targetProxy: proxyUuid,
    targetProxy_comment: 'PBXContainerItemProxy',
  };
  objects.PBXTargetDependency[`${depUuid}_comment`] = 'PBXTargetDependency';
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (!target.dependencies.some((d) => d.value === depUuid)) {
    target.dependencies.push({ value: depUuid, comment: 'PBXTargetDependency' });
  }
}

function stripUndefined(node) {
  if (Array.isArray(node)) {
    for (const item of node) stripUndefined(item);
    return;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (node[key] === undefined) {
        delete node[key];
      } else {
        stripUndefined(node[key]);
      }
    }
  }
}

function findClipTargetUuid(project) {
  const targets = project.pbxNativeTargetSection();
  for (const key of Object.keys(targets)) {
    if (key.endsWith('_comment')) continue;
    if (targets[key].name === CLIP_TARGET_NAME || targets[key].name === `"${CLIP_TARGET_NAME}"`) {
      return key;
    }
  }
  return null;
}

function addClipToScheme(iosRoot, projectName, clipUuid) {
  if (!clipUuid) return;
  const schemePath = path.join(
    iosRoot,
    `${projectName}.xcodeproj`,
    'xcshareddata',
    'xcschemes',
    `${projectName}.xcscheme`,
  );
  if (!fs.existsSync(schemePath)) return;
  const scheme = fs.readFileSync(schemePath, 'utf8');
  if (scheme.includes(`${CLIP_TARGET_NAME}.appclip`)) return;
  const entry = `         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "${clipUuid}"
               BuildableName = "${CLIP_TARGET_NAME}.appclip"
               BlueprintName = "${CLIP_TARGET_NAME}"
               ReferencedContainer = "container:${projectName}.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
`;
  const marker = '      </BuildActionEntries>';
  const idx = scheme.indexOf('         </BuildActionEntry>\n');
  if (idx === -1 || !scheme.includes(marker)) return;
  const insertAt = idx + '         </BuildActionEntry>\n'.length;
  fs.writeFileSync(schemePath, scheme.slice(0, insertAt) + entry + scheme.slice(insertAt));
}

module.exports = withAppClip;
