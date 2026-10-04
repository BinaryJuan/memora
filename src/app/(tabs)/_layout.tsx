import Feather from '@expo/vector-icons/Feather';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/ui';
import { strings } from '@/i18n/core';
import { useStore } from '@/store/store';
import { Fonts, useTheme } from '@/theme/theme';

function icon(name: IconName) {
  return function TabIcon({ color }: { color: ColorValue }) {
    return <Feather name={name} size={21} color={color} />;
  };
}

export default function TabsLayout() {
  const { c } = useTheme();
  // Android dibuja la app de borde a borde: la barra tiene que dejar lugar
  // a la de navegación del sistema (botones o gestos), que cambia según el celular.
  const { bottom } = useSafeAreaInsets();
  const onboarded = useStore((s) => s.settings.onboarded);
  if (!onboarded) return <Redirect href="/welcome" />;
  const t = strings().tabs;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          height: 68 + bottom,
          paddingTop: 8,
          paddingBottom: bottom + 8,
        },
        tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
        sceneStyle: { backgroundColor: c.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: t.home, tabBarIcon: icon('sun') }} />
      <Tabs.Screen name="calendar" options={{ title: t.calendar, tabBarIcon: icon('calendar') }} />
      <Tabs.Screen name="notes" options={{ title: t.notes, tabBarIcon: icon('file-text') }} />
      <Tabs.Screen name="settings" options={{ title: t.settings, tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
