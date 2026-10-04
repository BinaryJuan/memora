import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from '@/lib/notifications-api';
import { Linking, Platform } from 'react-native';

import { planAll, splitPlan, type Planned } from './notification-plan';
import type { MemoraEvent, Settings, Tag } from './types';

const CHANNEL_ID = 'recordatorios';
/** Avisos del día de una persona: traen el botón "Saludar por WhatsApp". */
const GREET_CATEGORY = 'saludar';
export const GREET_ACTION = 'saludar-whatsapp';
/** Android permite ~500 alarmas por app: dejamos margen. */
const MAX_SCHEDULED = 400;
/** Claves de los avisos que ya quedaron programados o avisados (ver `splitPlan`). */
const HANDLED_KEY = 'memora-avisos';
const supported = Platform.OS !== 'web';

export function setupNotifications() {
  if (!supported) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#B56E4D',
  }).catch(() => {});
  Notifications.setNotificationCategoryAsync(GREET_CATEGORY, [
    { identifier: GREET_ACTION, buttonTitle: 'Saludar por WhatsApp', options: { opensAppToForeground: true } },
  ]).catch(() => {});
}

export async function ensurePermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

async function loadHandled(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HANDLED_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function contentOf(p: Planned) {
  return {
    title: p.title,
    body: p.body,
    data: p.eventId ? { eventId: p.eventId } : {},
    categoryIdentifier: p.greet ? GREET_CATEGORY : undefined,
  };
}

let queue: Promise<void> = Promise.resolve();

/** Borra todos los avisos programados y los vuelve a programar según los datos actuales. */
export function rescheduleAll(events: MemoraEvent[], tags: Tag[], settings: Settings): Promise<void> {
  if (!supported) return Promise.resolve();
  // En fila, para que dos reprogramaciones no se pisen.
  queue = queue.then(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!settings.notificationsEnabled) return;
      const perm = await Notifications.getPermissionsAsync();
      if (!perm.granted) return;

      const now = new Date();
      const plan = splitPlan(planAll(events, tags, settings, now), await loadHandled(), now, MAX_SCHEDULED);

      for (const p of plan.schedule) {
        await Notifications.scheduleNotificationAsync({
          content: contentOf(p),
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: CHANNEL_ID },
        });
      }
      // Una fecha de hoy cargada después de la hora del aviso: avisamos ahora en vez de nunca.
      for (const p of plan.catchUp) {
        await Notifications.scheduleNotificationAsync({ content: contentOf(p), trigger: { channelId: CHANNEL_ID } });
      }
      await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify(plan.handled));
    } catch (err) {
      console.warn('No se pudieron programar los avisos', err);
    }
  });
  return queue;
}

/**
 * Desde Android 12 las alarmas "a la hora exacta" necesitan un permiso aparte, y desde Android 14
 * viene apagado. Sin él, Android puede atrasar los avisos (a veces horas) para ahorrar batería.
 */
export const exactAlarmsConfigurable = Platform.OS === 'android' && Number(Platform.Version) >= 31;

/** Abre la pantalla de "Alarmas y recordatorios" de Memora. Se resuelve cuando la persona vuelve. */
export async function openExactAlarmSettings() {
  const pkg = Constants.expoConfig?.android?.package ?? 'ar.com.memora.fechas';
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM, {
      data: `package:${pkg}`,
    });
  } catch {
    // Algunos teléfonos no tienen esa pantalla suelta: la ficha de la app también trae la opción.
    await Linking.openSettings().catch(() => {});
  }
}

export async function sendTestNotification() {
  if (!supported) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Memora 🎂', body: '¡Así te van a llegar los avisos!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL_ID },
  });
}
