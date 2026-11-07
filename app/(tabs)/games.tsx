import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { GameCard } from '../../components/GameCard';
import { CATEGORIES } from '../../lib/games/types';
import { GAMES } from '../../lib/games/registry';
import { Colors } from '../../lib/theme';

/** Games — browse the full library by category + search. */
export default function Games() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [category, setCategory] = useState<string>(params.category ?? 'all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((g) => {
      if (category !== 'all' && g.category !== category) return false;
      if (q && !`${g.name} ${g.tagline}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, query]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>LIBRARY</Text>
        <Text style={styles.title}>All games</Text>
        <Text style={styles.sub}>Every game is calm. No timers, no losing, no ads — pick whatever feels right.</Text>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search games…"
          placeholderTextColor="#5A6478"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.chips}>
          <TouchableOpacity style={[styles.chip, category === 'all' && styles.chipActive]} onPress={() => setCategory('all')} activeOpacity={0.8}>
            <Text style={[styles.chipText, category === 'all' && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {CATEGORIES.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.chip, category === c.id && styles.chipActive]} onPress={() => setCategory(c.id)} activeOpacity={0.8}>
              <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.empty}>Nothing matches that yet — try another word, or browse a category.</Text>
        ) : (
          <View style={styles.grid}>
            {filtered.map((g) => (
              <View key={g.id} style={styles.cell}>
                <GameCard game={g} wide />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 8 },
  kicker: { color: Colors.textMuted, fontSize: 13, fontWeight: '800', letterSpacing: 3 },
  title: { color: Colors.text, fontSize: 32, fontWeight: '800', marginTop: 8 },
  sub: { color: Colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6, marginBottom: 18 },
  search: {
    backgroundColor: '#111827',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    color: Colors.text,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 14,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipActive: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(143,216,181,0.5)' },
  chipText: { color: Colors.textSoft, fontSize: 14, fontWeight: '700' },
  chipTextActive: { color: Colors.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '48%' },
  empty: { color: Colors.textMuted, fontSize: 15, textAlign: 'center', marginTop: 40, lineHeight: 22 },
});
