import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Fonts, Radius, Space, useTheme } from '@/theme/theme';
import { tap } from './ui';

const DURATION = 6000;

interface ToastData {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Se llama si el aviso se va sin que toquen la acción (por ejemplo, para borrar fotos). */
  onExpire?: () => void;
}

interface ToastState {
  current: ToastData | null;
  show: (t: Omit<ToastData, 'id'>) => void;
  dismiss: (acted: boolean) => void;
}

let nextId = 1;

const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  show: (t) => {
    // Si había otro, se da por cerrado sin deshacer.
    get().current?.onExpire?.();
    set({ current: { ...t, id: nextId++ } });
  },
  dismiss: (acted) => {
    const cur = get().current;
    if (!cur) return;
    if (acted) cur.onAction?.();
    else cur.onExpire?.();
    set({ current: null });
  },
}));

export const showToast = (t: Omit<ToastData, 'id'>) => useToastStore.getState().show(t);

/** Aviso chiquito abajo de la pantalla, con un botón opcional ("Deshacer"). */
export function Toast() {
  const { c } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const current = useToastStore((s) => s.current);
  const dismiss = useToastStore((s) => s.dismiss);
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!current) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => dismiss(false), DURATION);
    return () => clearTimeout(timer);
  }, [current, anim, dismiss]);

  if (!current) return null;
  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          // Por encima de la barra de pestañas y del botón "Agregar".
          bottom: bottom + 150,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}>
      <View style={[styles.toast, { backgroundColor: c.text }]} accessibilityLiveRegion="polite">
        <Text style={[styles.msg, { color: c.bg }]} numberOfLines={2}>
          {current.message}
        </Text>
        {current.actionLabel ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              tap();
              dismiss(true);
            }}>
            <Text style={[styles.action, { color: c.accentSoft }]}>{current.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: Space.lg, right: Space.lg, zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingHorizontal: Space.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  msg: { flex: 1, fontFamily: Fonts.medium, fontSize: 14 },
  action: { fontFamily: Fonts.bold, fontSize: 14 },
});
