# Hugbug: Stress Relief Games — Build Notes (v1.0.0, build 1000)

First working local build. Built Nov 7, 2026 by Gabi (Muse) from the plan at
`~/workspace/beatrackfam-games/plan.md` and concept-visual-v2, copying the
proven Rewards kit 1:1 (same Expo SDK, router, Supabase PKCE auth, NativeTabs
Liquid Glass bar, GitHub Actions manual-dispatch builds).

## What was built

- **Hub shell:** Home (greeting, hero breathing card, mood chips
  Stressed/Anxious/Focus/Unwind with live game suggestions, category rails
  with "See all →", footer "No timers • No losing • No ads"), Games (browse
  all 11 by category + search), Breathe (guided sessions: Calm 4·4, Box
  4·4·4·4, Deep 4·7·8), You (profile, gentle progress, sounds mute toggle,
  reminders toggle, privacy policy, sign out).
- **Auth:** consent-first onboarding, email sign-up/sign-in with PKCE
  confirmation + password reset, Sign in with Apple (iOS, via
  `expo-apple-authentication` → Supabase `signInWithIdToken`), session-guard
  on the tabs (redirect to onboarding when signed out), App Tracking
  Transparency prompt (lazy-loaded — see "Bugs found" below).
- **Game registry + template:** `lib/games/registry.ts` (id, name, tagline,
  category, moods, icon, color, component) + `components/GameShell.tsx`
  (Back/Done header, one recorded calm moment per visit). Adding a game =
  one module + one registry entry.
- **Launch set (10 games + breathing anchor = 11):** Bubble Pop, Squeeze
  Ball, Ripple Tap, Zen Match, Slow Slide, Shape Sort, Calm Garden, Focus
  Maze, Pattern Memory, Number Path, Breathing. Every game: no fail state,
  no timer, no score pressure, no ads. Gentle haptics on key moments.
- **Progress:** tied to the account, cached in AsyncStorage for offline,
  best-effort sync to Supabase `game_progress` when configured. Gentle
  streaks that never punish a missed day. Calm Garden persists across
  visits; first tap plants a seed that sprouts immediately.
- **Sounds:** 5 soft synthesized chimes in `assets/sounds/` (expo-audio,
  lazy-loaded), mute toggle in You → Settings.
- **Icon/art:** original bug/leaf mark drawn with PIL (no photos, no brand
  assets): `assets/icon.png` 1024×1024, `assets/icon-android-512.png`,
  `assets/feature-graphic.png` 1024×500, `assets/splash.png`,
  `assets/favicon.png`, `assets/notification-icon.png`.
- **Store files:** `whats-new-1.0.0.txt` (ends with the required contact
  line), `supabase/schema.sql`, GitHub Actions `ios-build.yml` /
  `android-build.yml` / `release.yml` (manual trigger only), `eas.json`.
- **Screenshots:** `docs/screenshots/` — onboarding, home (+ Stressed mood
  suggestion), games browse, breathe, you, and one game per category
  (bubble-pop, zen-match, calm-garden; ripple-tap, number-path,
  focus-maze, breathing also captured).

## What's stubbed / placeholder

- **Supabase values are PLACEHOLDERS** in `eas.json`
  (`https://YOUR-HUGBUG-PROJECT.supabase.co` / `YOUR-HUGBUG-ANON-KEY`).
  Until a real project is created, `lib/supabase.ts` returns a null client:
  auth screens show their forms disabled and the app stays on onboarding.
  The app still runs fully offline (games, garden, progress) once a
  session exists. **Never reuse the Rewards Supabase project.**
- **Bundle ID `com.beatrackfaminc.hugbug` is PROVISIONAL** — Joey must
  confirm before any store upload; bundle IDs can't change after first
  upload.
- **All game titles are working titles, Joey-approval-pending** (see README).
- **No IAP, no ads in v1.** No BeaTrackFam branding, no eye logo, no merch
  assets anywhere.
- **Animations use React Native's built-in `Animated` API, not Reanimated
  and not Skia.** Calm games don't need a 60fps canvas loop; if a future
  game genuinely needs one, Skia gets added then. No new native deps in v1.

## What was verified (and how)

- `npx tsc --noEmit` — passes.
- `npx expo export` — passes; iOS + Android bundles produced (3.7MB / 4.1MB).
- `npx expo prebuild --clean` — passes; native project generated as
  `HugbugStressReliefGames` (Xcode scheme name — the iOS workflow was
  corrected to match), bundle ID `com.beatrackfaminc.hugbug` verified in
  the pbxproj, Android namespace verified in `build.gradle`.
- **Web preview (Playwright Chromium 125, true iPhone emulation 393×852
  @3x):** onboarding, Home (+ Stressed chip → suggestion rail), Games
  browse, Breathe, You, and all 11 game routes loaded with **zero JS
  errors**. Interactions verified: mood chip suggestion, garden plot tap
  → "Seed planted" (persisted), bubble/ripple taps. Screenshots in
  `docs/screenshots/`.
- **Bugs found and fixed during verification:**
  1. `expo-asset` resolved to 58.0.20 (SDK 58) under plain `npm install`
     and broke Metro (`expo/internal/bundle-origin` not found). Fixed with
     `npx expo install expo-asset` → 57.0.21. Lesson: run `npx expo
     install` for version alignment, not plain npm.
  2. `lib/tracking.ts` statically imported `expo-tracking-transparency`
     and redboxed the web preview at startup ("Cannot find native module
     'ExpoTrackingTransparency'"). Fixed by lazy dynamic import in
     try/catch — same rule as notifications. **The sibling AI app likely
     has the same static import — worth checking there.**

## What was NOT tested on a real device

**Nothing in this build has run on a real iPhone or Android device.**
Per Joey's bar, before any release every tab and button must be tested
working on a real device, including: the NativeTabs Liquid Glass bar
(check first for the known crash signature — app dies ~1s after tabs
mount, often as a permission prompt appears), Apple Sign In, email
confirmation deep links, haptics, sounds, and the garden across days.
The web preview's top pill tab bar is a web-only rendering artifact, not
the native bar.

## Joey-only steps remaining

1. **Supabase project:** create a DEDICATED project, run
   `supabase/schema.sql`, allowlist `hugbug://confirmed` and
   `hugbug://reset-password`, enable the Apple provider, put the real URL
   + anon key in `eas.json`.
2. **Bundle ID:** confirm `com.beatrackfaminc.hugbug` (can't change after
   first upload).
3. **App Store Connect:** create the app record, API key (secrets
   `ASC_API_KEY_ID` / `ASC_API_KEY_P8` / `ASC_API_ISSUER_ID` /
   `APPLE_TEAM_ID`), distribution certificate (`IOS_DISTRIBUTION_P12` +
   password), provisioning profile named "Hugbug App Store".
4. **Google Play:** create the app record, keystore + service account
   (`PLAY_SERVICE_ACCOUNT_JSON`), answer the trader declaration
   consistently with the other apps.
5. **Deploy key:** repo Settings → Deploy keys → Add, paste the contents
   of `/home/hatch/.ssh/id_ed25519_hugbug.pub` (private key never leaves
   that file). Until then the GitHub repo holds text files only — see
   "GitHub" below.
6. **Confirm the v1 game set + all titles** (all are approval-pending).
7. **Trademark-professional review of the "Hugbug" name before filing:**
   live US HUGBUG registrations exist in baby/toy classes (Diana Melikyan,
   reg. Apr 23, 2024 — plush toys/teddy bears + teethers/pacifiers; earlier
   baby bedding/clothing, use since 2009). No live Class 9/42 software
   registration was found, but the name is NOT fully clear.
8. **Run the iOS + Android workflows** (manual trigger) only after 1–4,
   then TestFlight + Play internal test, then real-device pass of every
   tab/button before submitting 1.0.0.

## GitHub

- **Repo does NOT exist yet — creation BLOCKED from here.** Attempted Nov 7,
  2026 via the GitHub connector (`create_repository`, public,
  `Joeey1116/BeaTrackFam-Game-App`): rejected with `403 Resource not
  accessible by integration` — the Muse GitHub App integration token cannot
  create repositories under Joey's account. The connector also has no
  deploy-key tool. **Joey step:** create the repo himself at
  github.com/new (name `BeaTrackFam-Game-App`, **Public**, no README), then
  tell Gabi. After that, push the full tree from this directory with the
  per-repo deploy key (step 5 above) — that brings code, icons, sounds,
  and screenshots up in one push. The MCP `push_files` snapshot path was
  NOT used: it carries UTF-8 text files only (binary assets would be
  rejected) and there is no repo to push to.
- The local repo already has the first commit with everything
  (`46fd6de`, `~/workspace/hugbug-games-app`, working tree clean).
- Nothing was submitted to App Store Connect or Google Play; no release
  was published.
