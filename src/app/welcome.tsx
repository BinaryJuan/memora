import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconBadge, type IconKey } from '@/components/icon';
import { Button, T } from '@/components/ui';
import { strings } from '@/i18n/core';
import { askExactAlarmsOnce, ensurePermission } from '@/lib/notifications';
import { useStore } from '@/store/store';
import { Radius, Space, useTheme } from '@/theme/theme';

const STEP_ICONS: IconKey[] = ['cake', 'bell', 'leaf'];

export default function WelcomeScreen() {
  const { c } = useTheme();
  const updateSettings = useStore((s) => s.updateSettings);
  const [index, setIndex] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  const w = strings().welcome;
  const step = { icon: STEP_ICONS[index], ...w.steps[index] };
  const isNotifications = index === 1;
  const isLast = index === STEP_ICONS.length - 1;

  const goTo = (next: number) => {
    Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setIndex(next);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  const finish = () => {
    updateSettings({ onboarded: true });
    router.replace('/');
  };

  const enableNotifications = async () => {
    if (Platform.OS !== 'web' && (await ensurePermission().catch(() => false))) await askExactAlarmsOnce();
    goTo(index + 1);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.skipRow}>
        {!isLast ? <Button label={w.skip} variant="ghost" small onPress={finish} /> : null}
      </View>

      <Animated.View style={[styles.body, { opacity: fade }]}>
        <IconBadge name={step.icon} size={120} />
        <T variant="display" style={styles.center}>
          {step.title}
        </T>
        <T muted style={[styles.center, { maxWidth: 320 }]}>
          {step.text}
        </T>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={w.step(index + 1, STEP_ICONS.length)}>
          {STEP_ICONS.map((icon, i) => (
            <View
              key={icon}
              style={[styles.dot, { backgroundColor: i === index ? c.accent : c.border, width: i === index ? 22 : 8 }]}
            />
          ))}
        </View>
        {isNotifications ? (
          <>
            <Button label={w.enable} icon="bell" onPress={enableNotifications} />
            <Button label={w.notNow} variant="ghost" onPress={() => goTo(index + 1)} />
          </>
        ) : isLast ? (
          <Button label={w.start} onPress={finish} />
        ) : (
          <Button label={w.next} onPress={() => goTo(index + 1)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: Space.xl },
  skipRow: { height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.lg },
  center: { textAlign: 'center' },
  footer: { gap: Space.sm, paddingBottom: Space.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Space.lg },
  dot: { height: 8, borderRadius: Radius.pill },
});
