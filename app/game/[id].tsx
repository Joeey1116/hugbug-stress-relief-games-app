import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { gameById } from '../../lib/games/registry';
import { Colors } from '../../lib/theme';

/** Game player — renders whatever the registry says for this id. */
export default function GamePlayer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = gameById(id ?? '');

  if (!game) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          That game isn't here yet.
        </Text>
        <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          Head back and pick another calm moment.
        </Text>
      </View>
    );
  }

  const Component = game.component;
  return <Component />;
}
