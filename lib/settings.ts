import AsyncStorage from '@react-native-async-storage/async-storage';

/** App settings persisted locally: sounds mute + daily-reminder opt-in. */
export interface Settings {
  muted: boolean;
  remindersEnabled: boolean;
  reminderHour: number; // 24h, default 20 (8 PM gentle nudge)
}

const KEY = 'hugbug:settings';
const DEFAULTS: Settings = { muted: false, remindersEnabled: true, reminderHour: 20 };

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(next: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const merged = { ...current, ...next };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    // Non-fatal.
  }
  return merged;
}
