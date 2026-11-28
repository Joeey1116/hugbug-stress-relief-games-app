import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../lib/auth';

/**
 * macOS variant of the (tabs) layout — Metro resolves this file instead
 * of _layout.tsx for platform === 'macos'; iOS/Android/web are
 * untouched.
 *
 * NativeTabs (the OS Liquid Glass tab bar) is iOS/Android-only and has
 * no macOS renderer, so the desktop window gets a plain left SIDEBAR
 * instead: the same four tabs, same labels, rendered as a vertical nav
 * next to the matched screen (<Slot />). Navigation goes through the
 * router with the same group hrefs the rest of the app already uses.
 *
 * Session guard is identical to _layout.tsx: the tabs exist ONLY
 * behind a real signed-in session; while the provider is restoring,
 * render the dark backdrop instead of flashing tabs or a redirect.
 * (On macOS the Firebase stub reports signed-out, so until a Mac auth
 * bridge exists the Mac app lands on onboarding — same as a signed-out
 * phone.)
 */

interface TabDef {
  href: string;
  match: (pathname: string) => boolean;
  label: string;
  ion: { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap };
}

const TABS: TabDef[] = [
  {
    href: '/(tabs)',
    match: (p) => p === '/' || p === '/index',
    label: 'Home',
    ion: { focused: 'home', outline: 'home-outline' },
  },
  {
    href: '/(tabs)/games',
    match: (p) => p.startsWith('/games'),
    label: 'Games',
    ion: { focused: 'grid', outline: 'grid-outline' },
  },
  {
    href: '/(tabs)/breathe',
    match: (p) => p.startsWith('/breathe'),
    label: 'Breathe',
    ion: { focused: 'leaf', outline: 'leaf-outline' },
  },
  {
    href: '/(tabs)/you',
    match: (p) => p.startsWith('/you'),
    label: 'You',
    ion: { focused: 'person-circle', outline: 'person-circle-outline' },
  },
];

export default function TabsLayoutMacOS() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: '#0B1120' }} />;
  }
  if (status !== 'signedIn') {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>Hugbug</Text>
        {TABS.map((tab) => {
          const focused = tab.match(pathname);
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.navigate(tab.href as never)}
              style={[styles.item, focused && styles.itemFocused]}
            >
              <Ionicons
                name={focused ? tab.ion.focused : tab.ion.outline}
                size={19}
                color={focused ? '#ffffff' : '#666666'}
              />
              <Text style={[styles.label, focused && styles.labelFocused]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#0B1120' },
  sidebar: {
    width: 216,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0E1628',
    paddingTop: 28,
    paddingHorizontal: 12,
    gap: 4,
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingBottom: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  itemFocused: { backgroundColor: 'rgba(255,255,255,0.08)' },
  label: { fontSize: 14, fontWeight: '500', color: '#666666' },
  labelFocused: { color: '#ffffff', fontWeight: '700' },
  content: { flex: 1, backgroundColor: '#0B1120' },
});
