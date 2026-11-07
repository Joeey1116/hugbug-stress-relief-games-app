import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { GameShell } from '../../components/GameShell';
import { playSound } from '../../lib/sounds';
import { Colors } from '../../lib/theme';

const PAIRS = [
  { icon: 'heart', color: '#F2B8A0' },
  { icon: 'star', color: '#F2D492' },
  { icon: 'moon', color: '#B9A8E8' },
  { icon: 'leaf', color: '#8FD8B5' },
] as const;

function shuffledDeck(): { key: number; pair: number }[] {
  const cards = [...PAIRS.map((_, i) => i), ...PAIRS.map((_, i) => i)];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((pair, key) => ({ key, pair }));
}

/** Zen Match — match soft pieces, no clock. The puzzle waits for you. */
export default function ZenMatchGame() {
  const [deck, setDeck] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);

  const flip = (key: number) => {
    if (busy || flipped.includes(key) || matched.includes(key)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = [...flipped, key];
    setFlipped(next);
    if (next.length === 2) {
      setTries((n) => n + 1);
      const [a, b] = next;
      if (deck[a].pair === deck[b].pair) {
        void playSound('chime');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMatched((m) => [...m, deck[a].pair]);
        setFlipped([]);
      } else {
        setBusy(true);
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 900);
      }
    }
  };

  const done = matched.length === PAIRS.length;
  const reshuffle = () => {
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched([]);
    setTries(0);
  };

  return (
    <GameShell gameId="zen-match" title="Zen Match" subtitle="Turn the pieces over and find the pairs. No clock, no lives — the puzzle waits for you.">
      <View style={styles.grid}>
        {deck.map((card) => {
          const isUp = flipped.includes(card.key) || matched.includes(card.pair);
          const pair = PAIRS[card.pair];
          return (
            <TouchableOpacity
              key={card.key}
              style={[styles.card, isUp && { borderColor: pair.color, backgroundColor: `${pair.color}22` }]}
              onPress={() => flip(card.key)}
              activeOpacity={0.85}
            >
              {isUp ? (
                <Ionicons name={pair.icon as any} size={34} color={pair.color} />
              ) : (
                <View style={styles.cardBack} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.status}>
        {done ? 'All matched. Lovely. Take a breath.' : matched.length === 0 ? 'Find a pair to begin — take your time.' : `${matched.length} of ${PAIRS.length} pairs found.`}
      </Text>
      {done && (
        <TouchableOpacity style={styles.again} onPress={reshuffle} activeOpacity={0.8}>
          <Text style={styles.againText}>SHUFFLE & PLAY AGAIN</Text>
        </TouchableOpacity>
      )}
      {tries > 0 && !done && <Text style={styles.tries}>{tries} gentle {tries === 1 ? 'try' : 'tries'}</Text>}
    </GameShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingTop: 16 },
  card: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)' },
  status: { color: Colors.textSoft, fontSize: 16, textAlign: 'center', marginTop: 28, lineHeight: 23 },
  tries: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 10 },
  again: {
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 32,
  },
  againText: { color: '#0B1120', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },
});
