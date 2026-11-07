import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

/**
 * Progress — tied to the account, cached locally for offline.
 *
 * Local cache is the source of truth on-device (AsyncStorage). When
 * Supabase is configured, plays also upsert into `game_progress`
 * (user_id, game_id, plays, last_played) — best-effort, failures are
 * swallowed so a missing table never breaks a game.
 *
 * Gentle streaks: a streak counts consecutive days with at least one
 * calm moment. A missed day never punishes — the streak simply rests
 * and restarts at 1 the next time you play. No streak is ever shown
 * as lost, broken, or failed.
 */

export interface ProgressState {
  plays: Record<string, number>;
  lastPlayed: Record<string, string>; // gameId -> ISO date
  garden: Record<string, number>; // plot index -> growth stage 0..3
  gardenPlantedAt: Record<string, string>;
  streakDays: number;
  lastCalmDay: string | null; // YYYY-MM-DD
  totalCalmMoments: number;
}

const EMPTY: ProgressState = {
  plays: {},
  lastPlayed: {},
  garden: {},
  gardenPlantedAt: {},
  streakDays: 0,
  lastCalmDay: null,
  totalCalmMoments: 0,
};

function keyFor(userId: string | null): string {
  return `hugbug:progress:${userId ?? 'local'}`;
}

function todayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

export async function loadProgress(userId: string | null): Promise<ProgressState> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

async function saveProgress(userId: string | null, state: ProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(state));
  } catch {
    // Storage failure must never break a game.
  }
}

/** Record one calm moment (a game played or a breathing session). */
export async function recordCalmMoment(userId: string | null, gameId: string): Promise<ProgressState> {
  const state = await loadProgress(userId);
  const today = todayKey();
  state.plays[gameId] = (state.plays[gameId] ?? 0) + 1;
  state.lastPlayed[gameId] = new Date().toISOString();
  state.totalCalmMoments += 1;
  if (state.lastCalmDay !== today) {
    // Gentle streak: yesterday continues it, any earlier day restarts at 1.
    state.streakDays = state.lastCalmDay === yesterdayKey() ? state.streakDays + 1 : 1;
    state.lastCalmDay = today;
  }
  await saveProgress(userId, state);
  // Best-effort Supabase sync.
  if (supabase && userId) {
    try {
      await supabase.from('game_progress').upsert(
        {
          user_id: userId,
          game_id: gameId,
          plays: state.plays[gameId],
          last_played: state.lastPlayed[gameId],
        },
        { onConflict: 'user_id,game_id' },
      );
    } catch {
      // Offline or table not created yet — local cache still has it.
    }
  }
  return state;
}

/** Garden: plant/water a plot. Returns the new stage (0 seed .. 3 bloom). */
export async function tendGarden(
  userId: string | null,
  plot: number,
): Promise<{ stage: number; state: ProgressState }> {
  const state = await loadProgress(userId);
  const stage = Math.min(3, (state.garden[String(plot)] ?? 0) + 1);
  state.garden[String(plot)] = stage;
  if (!state.gardenPlantedAt[String(plot)]) {
    state.gardenPlantedAt[String(plot)] = new Date().toISOString();
  }
  await saveProgress(userId, state);
  return { stage, state };
}

export async function resetGardenPlot(userId: string | null, plot: number): Promise<ProgressState> {
  const state = await loadProgress(userId);
  delete state.garden[String(plot)];
  delete state.gardenPlantedAt[String(plot)];
  await saveProgress(userId, state);
  return state;
}
