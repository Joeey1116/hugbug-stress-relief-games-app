import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function shuffled(): number[] {
  // Shuffle by random legal moves from solved — always solvable.
  const tiles = [...SOLVED];
  let blank = 8;
  for (let i = 0; i < 40; i++) {
    const row = Math.floor(blank / 3);
    const col = blank % 3;
    const moves: number[] = [];
    if (row > 0) moves.push(blank - 3);
    if (row < 2) moves.push(blank + 3);
    if (col > 0) moves.push(blank - 1);
    if (col < 2) moves.push(blank + 1);
    const pick = moves[Math.floor(Math.random() * moves.length)];
    [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
    blank = pick;
  }
  return tiles;
}

/** Slow Slide — slide tiles home gently. No timer, no move limit. */
export default function SlowSlideGame() {
  const [tiles, setTiles] = useState<number[]>(shuffled);
  const [moves, setMoves] = useState(0);

  const solved = tiles.every((t, i) => t === SOLVED[i]);
  const blank = tiles.indexOf(0);

  const tap = (idx: number) => {
    if (solved) return;
    const r1 = Math.floor(idx / 3);
    const c1 = idx % 3;
    const r2 = Math.floor(blank / 3);
    const c2 = blank % 3;
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound('ripple');
    const next = [...tiles];
    [next[idx], next[blank]] = [next[blank], next[idx]];
    setTiles(next);
    setMoves((m) => m + 1);
    if (next.every((t, i) => t === SOLVED[i])) {
      void playSound('complete');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const reshuffle = () => {
    setTiles(shuffled());
    setMoves(0);
  };

  return (
    <GameShell gameId="slow-slide" title="Slow Slide" subtitle="Tap a tile next to the empty space to slide it home. Get them in order — whenever you're ready.">
      <View style={styles.board}>
        {tiles.map((t, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tile, t === 0 && styles.blank]}
            onPress={() => tap(i)}
            activeOpacity={0.85}
          >
            {t !== 0 && <Text style={styles.tileText}>{t}</Text>}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.status}>
        {solved ? 'Home, all in order. Nicely done.' : `${moves} gentle move${moves === 1 ? '' : 's'} — no rush.`}
      </Text>
      <TouchableOpacity style={styles.again} onPress={reshuffle} activeOpacity={0.8}>
        <Text style={styles.againText}>{solved ? 'SHUFFLE & PLAY AGAIN' : 'SHUFFLE'}</Text>
      </TouchableOpacity>
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: 272,
    alignSelf: 'center',
    marginTop: 20,
  },
  tile: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: 'rgba(143,216,181,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(143,216,181,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blank: { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.08)' },
  tileText: { color: Colors.accent, fontSize: 30, fontWeight: '800' },
  status: { color: Colors.textSoft, fontSize: 16, textAlign: 'center', marginTop: 28 },
  again: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 48,
  },
  againText: { color: Colors.text, fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
