import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/icon';
import { Intro } from '@/components/intro';
import { LockGate } from '@/components/lock-gate';
import { Toast } from '@/components/toast';
import { Button, T } from '@/components/ui';
import { resolveLang, strings } from '@/i18n/core';
import { dateKey, yearsAt } from '@/lib/dates';
import { fillTemplate } from '@/lib/events';
import { greet } from '@/lib/media';
import { canScheduleExactAlarms, GREET_ACTION, rescheduleAll, setupNotifications } from '@/lib/notifications';
import * as Notifications from '@/lib/notifications-api';
import { chimeIfBirthday } from '@/lib/sound';
import type { Settings } from '@/lib/types';
import { useStore } from '@/store/store';
import { Space, useTheme } from '@/theme/theme';
import { refreshWidget } from '@/widget';

SplashScreen.preventAutoHideAsync();
setupNotifications();

const HOUR = 3_600_000;

function notificationSettingsChanged(a: Settings, b: Settings): boolean {
  return (
    a.notificationsEnabled !== b.notificationsEnabled ||
    a.notifyHour !== b.notifyHour ||
    a.weeklySummary !== b.weeklySummary ||
    a.defaultOffsets !== b.defaultOffsets ||
    // Los textos de los avisos y del widget dependen del idioma.
    a.language !== b.language
  );
}

function useNotificationSync() {
  const hydrated = useStore((s) => s.hydrated);
  useEffect(() => {
    if (!hydrated) return;
    let lastRun = 0;
    const run = () => {
      lastRun = Date.now();
      const { events, tags, settings } = useStore.getState();
      rescheduleAll(events, tags, settings);
      refreshWidget(events);
    };
    run();
    // Reprograma cuando cambian los datos (con una pequeña espera para agrupar cambios)…
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useStore.subscribe((s, prev) => {
      if (s.events === prev.events && s.tags === prev.tags && !notificationSettingsChanged(s.settings, prev.settings)) return;
      clearTimeout(timer);
      timer = setTimeout(run, 1200);
    });
    // …y al volver a la app, para ir sumando los avisos de los próximos años (como mucho una vez por hora).
    let exact = canScheduleExactAlarms();
    const appSub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      // Si se dio (o se quitó) el permiso de alarmas exactas, reprogramamos para que tome efecto ya.
      const nowExact = canScheduleExactAlarms();
      if (nowExact !== exact || Date.now() - lastRun > HOUR) run();
      exact = nowExact;
    });
    return () => {
      unsub();
      appSub.remove();
      clearTimeout(timer);
    };
  }, [hydrated]);
}

function openEventFromNotification(data: Record<string, unknown> | undefined, action: string) {
  const id = data?.eventId;
  if (typeof id !== 'string') return;
  const { events, templates, toggleGreeted } = useStore.getState();
  // Puede que la fecha se haya borrado después de programar el aviso.
  const event = events.find((e) => e.id === id);
  if (!event) return;
  router.push({ pathname: '/event/[id]', params: { id } });

  if (action === GREET_ACTION) {
    const today = new Date();
    const text = templates[0] ? fillTemplate(templates[0].text, event, yearsAt(event, today)) : '';
    greet('whatsapp', event.phone, text);
    if (!event.greetedOn.includes(dateKey(today))) toggleGreeted(event.id, dateKey(today));
  }
}

/** Sonidito de cumpleaños: al abrir la app (cuando termina la animación) y al volver a ella. */
function useBirthdayChime(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const ring = () => {
      const { events, settings } = useStore.getState();
      chimeIfBirthday(events, settings.birthdaySound);
    };
    ring();
    const sub = AppState.addEventListener('change', (st) => st === 'active' && ring());
    return () => sub.remove();
  }, [ready]);
}

/** Al tocar un aviso, abre la fecha correspondiente (también si la app estaba cerrada). */
function useNotificationTaps(ready: boolean) {
  useEffect(() => {
    if (!ready || Platform.OS === 'web') return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) =>
      openEventFromNotification(res.notification.request.content.data, res.actionIdentifier),
    );
    // La app se abrió desde un aviso: esperamos a que la navegación esté montada.
    const timer = setTimeout(() => {
      Notifications.getLastNotificationResponseAsync()
        .then((res) => {
          if (!res) return;
          openEventFromNotification(res.notification.request.content.data, res.actionIdentifier);
          return Notifications.clearLastNotificationResponseAsync();
        })
        .catch(() => {});
    }, 300);
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [ready]);
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { c } = useTheme();
  if (__DEV__) console.error(error);
  return (
    <View style={[styles.error, { backgroundColor: c.bg }]}>
      <IconBadge name="question" size={84} />
      <T variant="title" style={{ textAlign: 'center' }}>
        {strings().error.title}
      </T>
      <T muted style={{ textAlign: 'center' }}>
        {strings().error.text}
      </T>
      <Button label={strings().error.retry} icon="refresh-cw" onPress={retry} style={{ marginTop: Space.md }} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const hydrated = useStore((s) => s.hydrated);
  const lang = useStore((s) => resolveLang(s.settings.language));
  const { c, dark } = useTheme();
  const ready = fontsLoaded && hydrated;
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useNotificationSync();
  useNotificationTaps(ready);
  useBirthdayChime(ready && introDone);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const base = dark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.surface, text: c.text, border: c.border, primary: c.accent },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <LockGate>
        {/* Al cambiar de idioma se vuelve a montar todo, así ninguna pantalla queda con textos viejos. */}
        <Stack key={lang} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="event/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack>
      </LockGate>
      <Toast />
      {!introDone ? <Intro onDone={finishIntro} /> : null}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
});
