import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

// 7x7 maze: 1 = wall, 0 = open. One slow path from top-left to bottom-right.
const MAZE = [
  [0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [1, 1, 0, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
];
const START = { r: 0, c: 0 };
const GOAL = { r: 6, c: 6 };

/** Focus Maze — one slow path, full attention. No clock, no wrong turns that punish. */
export default function FocusMazeGame() {
  const [pos, setPos] = useState(START);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const step = (r: number, c: number) => {
    if (won) return;
    if (r < 0 || r > 6 || c < 0 || c > 6) return;
    if (MAZE[r][c] === 1) return;
    if (Math.abs(r - pos.r) + Math.abs(c - pos.c) !== 1) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void playSound('ripple');
    setPos({ r, c });
    setMoves((m) => m + 1);
    if (r === GOAL.r && c === GOAL.c) {
      setWon(true);
      void playSound('complete');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const reset = () => {
    setPos(START);
    setMoves(0);
    setWon(false);
  };

  return (
    <GameShell gameId="focus-maze" title="Focus Maze" subtitle="Tap a neighboring open square to walk the path. One slow way through — follow it at your own pace.">
      <View style={styles.board}>
        {MAZE.map((row, r) =>
          row.map((cell, c) => {
            const isPlayer = pos.r === r && pos.c === c;
            const isGoal = GOAL.r === r && GOAL.c === c;
            const isStart = START.r === r && START.c === c;
            return (
              <TouchableOpacity
                key={`${r}-${c}`}
                style={[
                  styles.cell,
                  cell === 1 && styles.wall,
                  isPlayer && styles.player,
                  isGoal && styles.goal,
                ]}
                onPress={() => step(r, c)}
                activeOpacity={0.9}
              >
                {isPlayer && <Text style={styles.playerDot}>●</Text>}
                {isGoal && !isPlayer && <Text style={styles.goalText}>✦</Text>}
                {isStart && !isPlayer && <Text style={styles.startText}>○</Text>}
              </TouchableOpacity>
            );
          }),
        )}
      </View>
      <Text style={styles.status}>
        {won ? 'You found the way through. Well done.' : `${moves} slow step${moves === 1 ? '' : 's'} — the path waits for you.`}
      </Text>
      {won && (
        <TouchableOpacity style={styles.again} onPress={reset} activeOpacity={0.8}>
          <Text style={styles.againText}>WALK IT AGAIN</Text>
        </TouchableOpacity>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  board: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, width: 308, alignSelf: 'center', marginTop: 20 },
  cell: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(156,200,232,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(156,200,232,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wall: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'transparent' },
  player: { backgroundColor: '#9CC8E8', borderColor: '#9CC8E8' },
  goal: { backgroundColor: 'rgba(143,216,181,0.25)', borderColor: 'rgba(143,216,181,0.6)' },
  playerDot: { color: '#0B1120', fontSize: 16 },
  goalText: { color: Colors.accent, fontSize: 18 },
  startText: { color: Colors.textMuted, fontSize: 14 },
  status: { color: Colors.textSoft, fontSize: 16, textAlign: 'center', marginTop: 26 },
  again: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 48,
  },
  againText: { color: '#0B1120', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
