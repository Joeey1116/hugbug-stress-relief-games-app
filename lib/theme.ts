/**
 * Hugbug design tokens — shared by the hub shell and every mini-game.
 * Dark navy calm palette from concept-visual-v2 (compact greeting header,
 * big mint breathing hero, glass chips, category rails).
 * No BeaTrackFam branding anywhere in this app.
 */
export const Colors = {
  bg: '#0B1120',
  bgDeep: '#070C16',
  card: 'rgba(255,255,255,0.06)',
  cardBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textSoft: '#C7CEDD',
  textMuted: '#8A93A8',
  accent: '#8FD8B5', // soft mint
  accentDeep: '#5FB98D',
  accentSoft: 'rgba(143,216,181,0.16)',
  lavender: '#B9A8E8',
  peach: '#F2B8A0',
  sky: '#9CC8E8',
  butter: '#F2D492',
  danger: '#FF9A9A',
} as const;

export const CategoryColors: Record<string, string> = {
  squishy: '#B9A8E8',
  puzzle: '#8FD8B5',
  focus: '#9CC8E8',
  breathe: '#8FD8B5',
};

export const Radii = {
  card: 20,
  pill: 999,
} as const;
