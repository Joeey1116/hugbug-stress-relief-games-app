import type { GameEntry } from './types';
import BubblePopGame from './bubble-pop';
import SqueezeBallGame from './squeeze-ball';
import RippleTapGame from './ripple-tap';
import ZenMatchGame from './zen-match';
import SlowSlideGame from './slow-slide';
import ShapeSortGame from './shape-sort';
import CalmGardenGame from './calm-garden';
import FocusMazeGame from './focus-maze';
import PatternMemoryGame from './pattern-memory';
import NumberPathGame from './number-path';
import BreathingGame from './breathing';

/**
 * Central game registry — the hub renders Home rails, Games browse, and
 * mood suggestions from this list. Adding a game = one module + one
 * entry here; the shell never changes.
 *
 * All titles are original working titles, Joey-approval-pending.
 */
export const GAMES: GameEntry[] = [
  { id: 'bubble-pop', name: 'Bubble Pop', tagline: 'Slow pops, no pressure.', category: 'squishy', moods: ['stressed', 'unwind'], icon: 'ellipse-outline', color: '#B9A8E8', component: BubblePopGame },
  { id: 'squeeze-ball', name: 'Squeeze Ball', tagline: 'Press a soft shape, watch it spring back.', category: 'squishy', moods: ['stressed', 'anxious'], icon: 'fitness', color: '#F2B8A0', component: SqueezeBallGame },
  { id: 'ripple-tap', name: 'Ripple Tap', tagline: 'Tap, watch it ripple.', category: 'squishy', moods: ['stressed', 'unwind'], icon: 'water', color: '#9CC8E8', component: RippleTapGame },
  { id: 'zen-match', name: 'Zen Match', tagline: 'Slow pieces, no rush.', category: 'puzzle', moods: ['anxious', 'unwind'], icon: 'grid', color: '#8FD8B5', component: ZenMatchGame },
  { id: 'slow-slide', name: 'Slow Slide', tagline: 'Slide it home, gently.', category: 'puzzle', moods: ['focus', 'anxious'], icon: 'move', color: '#B9A8E8', component: SlowSlideGame },
  { id: 'shape-sort', name: 'Shape Sort', tagline: 'Sort at your own pace.', category: 'puzzle', moods: ['focus', 'unwind'], icon: 'shapes', color: '#F2D492', component: ShapeSortGame },
  { id: 'calm-garden', name: 'Calm Garden', tagline: 'Tend a little garden each day.', category: 'puzzle', moods: ['unwind', 'anxious'], icon: 'leaf', color: '#8FD8B5', component: CalmGardenGame },
  { id: 'focus-maze', name: 'Focus Maze', tagline: 'Pulls you right in.', category: 'focus', moods: ['focus', 'anxious'], icon: 'git-branch', color: '#9CC8E8', component: FocusMazeGame },
  { id: 'pattern-memory', name: 'Pattern Memory', tagline: 'Remember, gently.', category: 'focus', moods: ['focus'], icon: 'apps', color: '#B9A8E8', component: PatternMemoryGame },
  { id: 'number-path', name: 'Number Path', tagline: 'Follow the numbers.', category: 'focus', moods: ['focus', 'unwind'], icon: 'trail-sign', color: '#8FD8B5', component: NumberPathGame },
  { id: 'breathing', name: 'Breathing', tagline: 'Guided sessions, always here.', category: 'breathe', moods: ['stressed', 'anxious', 'focus', 'unwind'], icon: 'refresh-circle', color: '#8FD8B5', component: BreathingGame },
];

export function gameById(id: string): GameEntry | undefined {
  return GAMES.find((g) => g.id === id);
}

export function gamesForCategory(category: string): GameEntry[] {
  return GAMES.filter((g) => g.category === category);
}

export function gamesForMood(mood: string): GameEntry[] {
  return GAMES.filter((g) => g.moods.includes(mood as any));
}
