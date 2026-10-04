import * as Notifications from '@/lib/notifications-api';
import { Platform } from 'react-native';

import { addDays, formatShortDate, nextOccurrences, startOfDay, yearsAt } from './dates';
import { effectiveOffsets } from './events';
import { getKind } from './kinds';
import type { MemoraEvent, Settings, Tag } from './types';

const CHANNEL_ID = 'recordatorios';
/** Avisos del día de una persona: traen el botón "Saludar por WhatsApp". */
const GREET_CATEGORY = 'saludar';
export const GREET_ACTION = 'saludar-whatsapp';
/** Android permite ~500 alarmas por app: dejamos margen. */
const MAX_SCHEDULED = 400;
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

interface Planned {
  date: Date;
  title: string;
  body: string;
  eventId?: string;
  greet?: boolean;
}

function planForEvent(e: MemoraEvent, offsets: number[], hour: number, now: Date): Planned[] {
  const kind = getKind(e.kind);
  const count = e.recurrence === 'monthly' ? 3 : 2;
  const out: Planned[] = [];
  for (const occ of nextOccurrences(e, count, now)) {
    const years = yearsAt(e, occ);
    const yearsText = years && kind.yearsLabel ? kind.yearsLabel(years) : null;
    for (const offset of offsets) {
      const date = addDays(occ, -offset);
      date.setHours(hour, 0, 0, 0);
      if (date <= now) continue;
      let title: string;
      if (offset === 0) {
        title = kind.person ? `Hoy es ${kind.phrase(e.title)} ${kind.emoji}` : `${kind.emoji} Hoy: ${e.title}`;
      } else if (offset === 1) {
        title = `Mañana: ${kind.phrase(e.title)}`;
      } else {
        title = `En ${offset} días: ${kind.phrase(e.title)}`;
      }
      const parts: string[] = [];
      if (yearsText) parts.push(yearsText);
      if (offset === 0 && kind.person) parts.push('¡No te olvides de saludar!');
      if (offset > 0 && e.giftIdeas.length > 0 && kind.person) parts.push('Tenés ideas de regalo anotadas 🎁');
      if (parts.length === 0) parts.push(kind.label);
      out.push({ date, title, body: parts.join(' · '), eventId: e.id, greet: offset === 0 && kind.person });
    }
  }
  return out;
}

function planWeeklySummaries(events: MemoraEvent[], hour: number, now: Date): Planned[] {
  const out: Planned[] = [];
  const today = startOfDay(now);
  const toMonday = (8 - today.getDay()) % 7; // 0 si hoy es lunes
  for (let w = 0; w < 6; w++) {
    const monday = addDays(today, toMonday + w * 7);
    const sunday = addDays(monday, 6);
    const items: { date: Date; title: string }[] = [];
    for (const e of events) {
      for (const occ of nextOccurrences(e, 1, monday)) {
        if (occ <= sunday) items.push({ date: occ, title: e.title });
      }
    }
    if (items.length === 0) continue;
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    const date = new Date(monday);
    date.setHours(hour, 0, 0, 0);
    if (date <= now) continue;
    out.push({
      date,
      title: items.length === 1 ? 'Esta semana tenés 1 fecha' : `Esta semana tenés ${items.length} fechas`,
      body: items.map((i) => `${i.title} (${formatShortDate(i.date)})`).join(', '),
    });
  }
  return out;
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
      const planned: Planned[] = [];
      for (const e of events) {
        planned.push(...planForEvent(e, effectiveOffsets(e, tags, settings), settings.notifyHour, now));
      }
      if (settings.weeklySummary) planned.push(...planWeeklySummaries(events, settings.notifyHour, now));

      planned.sort((a, b) => a.date.getTime() - b.date.getTime());
      for (const p of planned.slice(0, MAX_SCHEDULED)) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: p.title,
            body: p.body,
            data: p.eventId ? { eventId: p.eventId } : {},
            categoryIdentifier: p.greet ? GREET_CATEGORY : undefined,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.date, channelId: CHANNEL_ID },
        });
      }
    } catch (err) {
      console.warn('No se pudieron programar los avisos', err);
    }
  });
  return queue;
}

export async function sendTestNotification() {
  if (!supported) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Memora 🎂', body: '¡Así te van a llegar los avisos!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: CHANNEL_ID },
  });
}
