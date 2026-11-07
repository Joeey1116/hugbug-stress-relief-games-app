import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

const COUNT = 12;

function shuffledNumbers(): number[] {
  const nums = Array.from({ length: COUNT }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums;
}

/** Number Path — follow the numbers to the end. A wrong tap just waits. */
export default function NumberPathGame() {
  const [tiles, setTiles] = useState<number[]>(shuffledNumbers);
  const [next, setNext] = useState(1);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [note, setNote] = useState('Find 1 to begin.');

  const tap = (n: number) => {
    if (found.has(n)) return;
    if (n === next) {
      void playSound('chime');
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const f = new Set(found);
      f.add(n);
      setFound(f);
      if (next === COUNT) {
        setNote('All the way to 12. Beautifully steady.');
        void playSound('complete');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setNext(next + 1);
        setNote(`Now find ${next + 1}.`);
      }
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNote(`That is ${n} — you're looking for ${next}. No harm done.`);
    }
  };

  const done = found.size === COUNT;
  const reset = () => {
    setTiles(shuffledNumbers());
    setNext(1);
    setFound(new Set());
    setNote('Find 1 to begin.');
  };

  return (
    <GameShell gameId="number-path" title="Number Path" subtitle="Follow the numbers from 1 to 12. Tap the next one when you spot it — there's no clock.">
      <View style={styles.grid}>
        {tiles.map((n) => {
          const isFound = found.has(n);
          return (
            <TouchableOpacity
              key={n}
              style={[styles.tile, isFound && styles.tileFound]}
              onPress={() => tap(n)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tileText, isFound && styles.tileTextFound]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.note}>{note}</Text>
      {done && (
        <TouchableOpacity style={styles.again} onPress={reset} activeOpacity={0.8}>
          <Text style={styles.againText}>SHUFFLE & GO AGAIN</Text>
        </TouchableOpacity>
      )}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingTop: 16 },
  tile: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFound: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(143,216,181,0.5)' },
  tileText: { color: Colors.text, fontSize: 26, fontWeight: '800' },
  tileTextFound: { color: Colors.accent },
  note: { color: Colors.textSoft, fontSize: 16, textAlign: 'center', marginTop: 28 },
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
