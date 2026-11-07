import type { ComponentType } from 'react';

export type Mood = 'stressed' | 'anxious' | 'focus' | 'unwind';
export type GameCategory = 'squishy' | 'puzzle' | 'focus' | 'breathe';

export interface GameProps {
  /** Called when the player taps the shell's Done button. */
  onDone?: () => void;
}

export interface GameEntry {
  id: string;
  /** Working title — all names are Joey-approval-pending (see README). */
  name: string;
  tagline: string;
  category: GameCategory;
  moods: Mood[];
  /** Ionicons name rendered on the game card. */
  icon: string;
  /** Soft accent color for the card icon tile. */
  color: string;
  component: ComponentType<GameProps>;
}

export const MOODS: { id: Mood; label: string; blurb: string }[] = [
  { id: 'stressed', label: 'Stressed', blurb: 'Something soft, right now.' },
  { id: 'anxious', label: 'Anxious', blurb: 'Slow and steady wins.' },
  { id: 'focus', label: 'Focus', blurb: 'Something to sink into.' },
  { id: 'unwind', label: 'Unwind', blurb: 'Just drift a little.' },
];

export const CATEGORIES: { id: GameCategory; label: string; blurb: string }[] = [
  { id: 'squishy', label: 'Squishy', blurb: 'Pop, squeeze, fidget.' },
  { id: 'puzzle', label: 'Puzzles', blurb: 'Slow pieces, no rush.' },
  { id: 'focus', label: 'Focus', blurb: 'Pulls you right in.' },
  { id: 'breathe', label: 'Breathe', blurb: 'Always one tap away.' },
];
