import { daysBetween, nextOccurrence, yearsAt } from './dates';
import type { MemoraEvent, Settings, Tag } from './types';

export interface Upcoming {
  event: MemoraEvent;
  date: Date;
  days: number;
  years: number | null;
}

export function upcomingOf(e: MemoraEvent, from: Date = new Date()): Upcoming | null {
  const date = nextOccurrence(e, from);
  if (!date) return null;
  return { event: e, date, days: daysBetween(from, date), years: yearsAt(e, date) };
}

export function upcomingList(events: MemoraEvent[], from: Date = new Date()): Upcoming[] {
  return events
    .map((e) => upcomingOf(e, from))
    .filter((u): u is Upcoming => u !== null)
    .sort((a, b) => a.days - b.days || a.event.title.localeCompare(b.event.title));
}

/** Prioridad: la fecha > la primera etiqueta con avisos propios > los ajustes. */
export function effectiveOffsets(e: MemoraEvent, tags: Tag[], settings: Settings): number[] {
  if (e.reminderOffsets) return e.reminderOffsets;
  for (const id of e.tagIds) {
    const tag = tags.find((t) => t.id === id);
    if (tag?.reminderOffsets) return tag.reminderOffsets;
  }
  return settings.defaultOffsets;
}

export function firstName(title: string): string {
  return title.trim().split(/\s+/)[0] ?? title;
}

/** Completa {nombre} y {edad} (o {name} y {age}, en inglés) en un mensaje de saludo. */
export function fillTemplate(text: string, e: MemoraEvent, years: number | null): string {
  let out = text.replace(/\{(nombre|name)\}/g, firstName(e.title));
  out = years ? out.replace(/\{(edad|age)\}/g, String(years)) : out.replace(/\s*(los\s+)?\{(edad|age)\}/g, '');
  return out;
}

export function initials(title: string): string {
  const parts = title
    .trim()
    .split(/\s+/)
    .filter((w) => w && !['y', 'e', '&', 'de', 'del'].includes(w.toLowerCase()));
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** Para buscar sin importar mayúsculas ni tildes ("Martín" = "martin"). */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
