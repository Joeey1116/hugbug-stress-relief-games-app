import React from 'react';
import { Platform, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth';

/**
 * Bottom navigation is the OS's OWN tab bar (UITabBar on iOS, the
 * Material navigation bar on Android) — the genuine Liquid Glass bar,
 * copied 1:1 from the proven Rewards setup (same expo-router /
 * react-native-screens versions). Never an imitation capsule bar.
 *
 * Session guard: the tabs exist ONLY behind a real signed-in session.
 * While the provider is still restoring, render the dark backdrop
 * instead of flashing either the tabs or a redirect.
 */
/**
 * tvOS fallback (Nov 27, 2026, mirroring the Flight Journal pilot):
 * NativeTabs (Liquid Glass UITabBar) is not the tvOS navigation model —
 * Apple TV needs a focus-driven bar the Siri Remote can move through.
 * The JS Tabs bar below renders the same four tabs; its Pressable-based
 * bar items are focusable under the react-native-tvos fork. iOS,
 * Android and macOS never take this branch (Platform.isTV is false
 * there; macOS uses _layout.macos.tsx regardless).
 */
function JsTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0B1120', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#666666',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="breathe"
        options={{
          title: 'Breathe',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: 'You',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: '#0B1120' }} />;
  }
  if (status !== 'signedIn') {
    return <Redirect href="/onboarding" />;
  }

  if ((Platform as unknown as { isTV?: boolean }).isTV) {
    return <JsTabsLayout />;
  }

  return (
    <NativeTabs
      tintColor="#ffffff"
      iconColor={{ default: '#666666', selected: '#ffffff' }}
      labelStyle={{
        default: { color: '#666666', fontWeight: '500' },
        selected: { color: '#ffffff', fontWeight: '700' },
      }}
    >
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: '#0B1120' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="games" contentStyle={{ backgroundColor: '#0B1120' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Games</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'squareshape.split.2x2', selected: 'squareshape.split.2x2.dotted' }} md="grid_view" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="breathe" contentStyle={{ backgroundColor: '#0B1120' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>Breathe</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'wind', selected: 'wind' }} md="air" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you" contentStyle={{ backgroundColor: '#0B1120' }} disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
