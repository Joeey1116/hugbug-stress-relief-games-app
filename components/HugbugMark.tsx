import { StyleSheet, View } from 'react-native';
import { Colors } from '../lib/theme';

/**
 * Hugbug mark — an original calm bug on a leaf-green disc, drawn with
 * plain Views (no image asset, no brand assets). Used on the splash,
 * onboarding, and auth screens.
 */
export function HugbugMark({ size = 72 }: { size?: number }) {
  const s = size;
  return (
    <View
      style={[
        styles.disc,
        { width: s, height: s, borderRadius: s / 2, backgroundColor: Colors.accentSoft },
      ]}
    >
      {/* antennae */}
      <View style={[styles.antenna, styles.antennaL, { width: s * 0.05, height: s * 0.22 }]} />
      <View style={[styles.antenna, styles.antennaR, { width: s * 0.05, height: s * 0.22 }]} />
      {/* body */}
      <View
        style={[
          styles.body,
          { width: s * 0.56, height: s * 0.48, borderRadius: s * 0.28, backgroundColor: Colors.accent },
        ]}
      >
        <View style={[styles.dot, { width: s * 0.09, height: s * 0.09, top: s * 0.1, left: s * 0.1 }]} />
        <View style={[styles.dot, { width: s * 0.09, height: s * 0.09, top: s * 0.1, right: s * 0.1 }]} />
        <View style={[styles.dot, { width: s * 0.09, height: s * 0.09, bottom: s * 0.09, left: s * 0.17 }]} />
      </View>
      {/* head */}
      <View
        style={[
          styles.head,
          { width: s * 0.26, height: s * 0.2, borderRadius: s * 0.13, backgroundColor: Colors.accentDeep },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(143,216,181,0.35)' },
  body: { position: 'relative', marginTop: '14%' },
  head: { position: 'absolute', top: '16%' },
  dot: { position: 'absolute', borderRadius: 999, backgroundColor: '#0B1120', opacity: 0.55 },
  antenna: { position: 'absolute', top: '6%', backgroundColor: Colors.accent, borderRadius: 999 },
  antennaL: { left: '36%', transform: [{ rotate: '-24deg' }] },
  antennaR: { right: '36%', transform: [{ rotate: '24deg' }] },
});
