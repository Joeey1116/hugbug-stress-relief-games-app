# Hugbug: Stress Relief Games

A standalone calm-games hub — **not** linked to the BeaTrackFam store or merch.
One app, a library of mini-games, mood-matched. No timers, no losing, no ads.

- **Name (LOCKED by Joey, Nov 6 2026):** "Hugbug: Stress Relief Games" (27 chars, fits the 30-char store limit)
- **Version:** 1.0.0 (iOS build 1000 / Android versionCode 1000)
- **Bundle ID (PROVISIONAL — Joey must confirm before any store upload; bundle IDs can't change after first upload):** `com.beatrackfaminc.hugbug`
- **Scheme:** `hugbug`
- **Stack:** Expo SDK ~57.0.26, expo-router ~57.0.24, React Native 0.86.3, Supabase Auth (PKCE), native Liquid Glass tabs (expo-router `unstable-native-tabs`)

## The library (v1 — 10 games + breathing anchor)

| Category | Games |
|---|---|
| Squishy | Bubble Pop, Squeeze Ball, Ripple Tap |
| Puzzles | Zen Match, Slow Slide, Shape Sort, Calm Garden |
| Focus | Focus Maze, Pattern Memory, Number Path |
| Anchor | Breathing (guided sessions) |

All game titles are **original working titles — Joey-approval-pending**. None is final until Joey picks it and it passes the uniqueness check.

## How it works

- **Home** — greeting, hero breathing card, mood chips (Stressed / Anxious / Focus / Unwind) that suggest games, category rails with "See all →".
- **Games** — browse the full library by category + search.
- **Breathe** — guided breathing (Calm 4·4, Box 4·4·4·4, Deep 4·7·8), always one tap away.
- **You** — profile, gentle progress (streaks never punish a missed day), sounds mute toggle, reminders, sign out.

Adding a game = one module in `lib/games/` + one entry in `lib/games/registry.ts`. The shell never changes.

## Tech notes

- Animations use React Native's built-in `Animated` API — no Reanimated, no Skia in v1. Calm games don't need a 60fps canvas loop; if a future game genuinely needs one, Skia gets added then.
- Sounds are soft synthesized chimes in `assets/sounds/` (expo-audio), with a mute toggle in You → Settings.
- Haptics via `expo-haptics` on key moments.
- Progress is tied to the account (Supabase `game_progress`, cached in AsyncStorage for offline). When Supabase isn't configured, the app still works fully offline.
- Auth: email + Apple Sign In (expo-apple-authentication → Supabase `signInWithIdToken`), PKCE email confirmation, consent-first onboarding, App Tracking Transparency prompt.

## Setup (Joey steps — see BUILD-NOTES.md for the full list)

1. Create a **dedicated Supabase project** for Hugbug, run `supabase/schema.sql`, allowlist `hugbug://confirmed` and `hugbug://reset-password`, enable the Apple provider.
2. Put the real URL + anon key in `eas.json` (placeholders there now).
3. Confirm the bundle ID, create the App Store Connect app record + API key + distribution cert + provisioning profile, and the Play app record + keystore + service account.
4. Add the deploy key: repo Settings → Deploy keys → paste `~/.ssh/id_ed25519_hugbug.pub` (if not already added).
5. Confirm the v1 game set + all titles, and get a trademark-professional review of the "Hugbug" name before filing (live US HUGBUG registrations exist in baby/toy classes).

## Builds

GitHub Actions, manual trigger only (`workflow_dispatch`): `.github/workflows/ios-build.yml`, `android-build.yml`, `release.yml` (attaches IPA + AAB to the `vX.Y.Z` release). Never run on their own.

## What's New (1.0.0)

See `whats-new-1.0.0.txt`.
