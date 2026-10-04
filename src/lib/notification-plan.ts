import { addDays, dateKey, formatShortDate, nextOccurrences, startOfDay, yearsAt } from './dates';
import { effectiveOffsets } from './events';
import { getKind } from './kinds';
import type { MemoraEvent, Settings, Tag } from './types';

/** Qué avisos tocan y cuándo. Lógica pura: lo que habla con Android está en `notifications.ts`. */

export interface Planned {
  date: Date;
  title: string;
  body: string;
  eventId?: string;
  greet?: boolean;
  /**
   * Identifica el aviso de una fecha: `AAAA-MM-DD|id|días de anticipación` (el día es el del aviso).
   * No incluye la hora: si se cambia el horario, no se repite un aviso que ya llegó. Los resúmenes no tienen.
   */
  key?: string;
}

/** Avisos tardíos que se mandan de una vez, como mucho (por si se importa un respaldo con muchas fechas de hoy). */
const MAX_CATCH_UP = 10;

function planForEvent(e: MemoraEvent, offsets: number[], hour: number, now: Date): Planned[] {
  const kind = getKind(e.kind);
  const count = e.recurrence === 'monthly' ? 3 : 2;
  const today = dateKey(now);
  const out: Planned[] = [];
  for (const occ of nextOccurrences(e, count, now)) {
    const years = yearsAt(e, occ);
    const yearsText = years && kind.yearsLabel ? kind.yearsLabel(years) : null;
    for (const offset of offsets) {
      const date = addDays(occ, -offset);
      date.setHours(hour, 0, 0, 0);
      const day = dateKey(date);
      // Los de hoy se planean aunque su hora ya haya pasado: puede que haya que avisarlos tarde.
      if (date <= now && day !== today) continue;
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
      out.push({
        date,
        title,
        body: parts.join(' · '),
        eventId: e.id,
        greet: offset === 0 && kind.person,
        key: `${day}|${e.id}|${offset}`,
      });
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

/** Todos los avisos que corresponden según los datos, ordenados por fecha. */
export function planAll(events: MemoraEvent[], tags: Tag[], settings: Settings, now: Date): Planned[] {
  const planned: Planned[] = [];
  for (const e of events) planned.push(...planForEvent(e, effectiveOffsets(e, tags, settings), settings.notifyHour, now));
  if (settings.weeklySummary) planned.push(...planWeeklySummaries(events, settings.notifyHour, now));
  return planned.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface NotificationPlan {
  /** Para dejarle a Android, a su hora. */
  schedule: Planned[];
  /** Su hora ya pasó y nunca se programaron (la fecha se cargó tarde, por ejemplo): se avisan ya. */
  catchUp: Planned[];
  /** Lo que hay que recordar para la próxima vez. */
  handled: string[];
}

/**
 * Separa lo que se programa de lo que hay que avisar tarde.
 *
 * `handledBefore` son las claves de avisos que ya quedaron en manos de Android antes de su hora
 * (o que ya se avisaron tarde). Sin esto no se puede distinguir un aviso que Android ya mostró
 * de uno que nunca se llegó a programar, como el de una fecha de hoy cargada después de la hora del aviso.
 */
export function splitPlan(planned: Planned[], handledBefore: readonly string[], now: Date, max: number): NotificationPlan {
  const today = dateKey(now);
  // Solo importan de hoy en adelante: así la lista no crece para siempre.
  const handled = new Set(handledBefore.filter((k) => k.slice(0, 10) >= today));
  const schedule = planned.filter((p) => p.date > now).slice(0, max);
  const catchUp = planned.filter((p) => p.date <= now && p.key && !handled.has(p.key)).slice(0, MAX_CATCH_UP);
  for (const p of [...schedule, ...catchUp]) if (p.key) handled.add(p.key);
  return { schedule, catchUp, handled: [...handled] };
}
