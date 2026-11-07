import { loadSettings } from './settings';

/**
 * Gentle sounds — soft synthesized chimes bundled in assets/sounds,
 * played through expo-audio. No music streaming, no loud effects.
 * Mute toggle lives in You → Settings and is respected here on every play.
 *
 * expo-audio is loaded lazily (dynamic import in try/catch) so a missing
 * native module can never break a game screen — same crash-safety rule
 * as notifications.
 */
type SoundName = 'pop' | 'chime' | 'complete' | 'ripple' | 'breath';

const SOUND_FILES: Record<SoundName, any> = {
  pop: require('../assets/sounds/pop.wav'),
  chime: require('../assets/sounds/chime.wav'),
  complete: require('../assets/sounds/complete.wav'),
  ripple: require('../assets/sounds/ripple.wav'),
  breath: require('../assets/sounds/breath.wav'),
};

const players: Partial<Record<SoundName, any>> = {};

export async function playSound(name: SoundName): Promise<void> {
  try {
    const settings = await loadSettings();
    if (settings.muted) return;
    const { createAudioPlayer } = await import('expo-audio');
    let player = players[name];
    if (!player) {
      player = createAudioPlayer(SOUND_FILES[name]);
      players[name] = player;
    }
    try {
      player.seekTo(0);
    } catch {
      // Seek unsupported on this platform — replay still works.
    }
    player.play();
  } catch {
    // Audio unavailable (web without user gesture, old build) — silent is fine.
  }
}
