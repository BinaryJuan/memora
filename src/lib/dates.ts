import { strings } from '@/i18n/core';

import type { MemoraEvent } from './types';

const DAY_MS = 86_400_000;

/** Nombre del mes (1-12) en el idioma actual, en minúscula si el idioma lo escribe así. */
export function monthName(month: number): string {
  return strings().dates.months[month - 1];
}

export function monthNames(): string[] {
  return strings().dates.months;
}

/** Iniciales de los días, empezando por el primer día de la semana del idioma. */
export function weekdayInitials(): string[] {
  const { dates, weekStartsOn } = strings();
  return [...dates.weekdayInitials.slice(weekStartsOn), ...dates.weekdayInitials.slice(0, weekStartsOn)];
}

/** Columna (0-6) en la que cae un día de la semana (0 = domingo) según el idioma. */
export function weekdayColumn(day: number): number {
  return (day - strings().weekStartsOn + 7) % 7;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Crea la fecha ajustando el día si el mes es más corto (29/2 → 28/2). */
export function clampDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, Math.min(day, daysInMonth(year, month)));
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** Fecha en la que cae el evento dentro de un mes dado, o null si no cae. */
export function occurrenceInMonth(e: MemoraEvent, year: number, month: number): Date | null {
  if (e.recurrence === 'once') {
    return e.year === year && e.month === month ? clampDate(year, month, e.day) : null;
  }
  if (e.year && year < e.year) return null;
  if (e.recurrence === 'yearly') {
    return e.month === month ? clampDate(year, month, e.day) : null;
  }
  if (e.year && year === e.year && month < e.month) return null;
  return clampDate(year, month, e.day);
}

/** Próxima vez que ocurre (hoy incluido), o null si ya pasó y no se repite. */
export function nextOccurrence(e: MemoraEvent, from: Date = new Date()): Date | null {
  const today = startOfDay(from);
  let y = today.getFullYear();
  let m = today.getMonth() + 1;
  // Busca mes a mes: alcanza con 2 años y medio, o hasta el año de inicio si está en el futuro.
  const limit = e.year && e.year >= y ? (e.year - y + 2) * 12 : 30;
  for (let i = 0; i < limit && i < 3000; i++) {
    const occ = occurrenceInMonth(e, y, m);
    if (occ && occ >= today) return occ;
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return null;
}

/** Las próximas `count` ocurrencias desde `from`. */
export function nextOccurrences(e: MemoraEvent, count: number, from: Date = new Date()): Date[] {
  const out: Date[] = [];
  let cursor = startOfDay(from);
  while (out.length < count) {
    const occ = nextOccurrence(e, cursor);
    if (!occ) break;
    out.push(occ);
    cursor = addDays(occ, 1);
  }
  return out;
}

/** Años que se cumplen en esa ocurrencia (solo si se conoce el año y se repite anualmente). */
export function yearsAt(e: MemoraEvent, occ: Date): number | null {
  if (!e.year || e.recurrence !== 'yearly') return null;
  const n = occ.getFullYear() - e.year;
  return n > 0 ? n : null;
}

const MILESTONES = new Set([1, 15, 18, 21, 25, 50, 75, 100]);
export function isMilestone(n: number | null): boolean {
  return n !== null && (MILESTONES.has(n) || n % 10 === 0);
}

export function countdownLabel(days: number): string {
  const d = strings().dates;
  if (days === 0) return d.today;
  if (days === 1) return d.tomorrow;
  return d.inDays(days);
}

export function shortCountdown(days: number): string {
  const d = strings().dates;
  if (days === 0) return d.today;
  if (days === 1) return d.tomorrow;
  return d.daysShort(days);
}

export function formatDayMonth(day: number, month: number): string {
  return strings().dates.dayMonth(day, monthName(month));
}

export function formatEventDate(e: MemoraEvent): string {
  const d = strings().dates;
  if (e.recurrence === 'monthly') return d.everyMonth(e.day);
  return e.year ? d.dayMonthYear(e.day, monthName(e.month), e.year) : formatDayMonth(e.day, e.month);
}

export function formatLongDate(date: Date): string {
  const d = strings().dates;
  return capitalize(d.longDate(d.weekdays[date.getDay()], date.getDate(), d.months[date.getMonth()]));
}

export function formatShortDate(date: Date): string {
  return strings().dates.shortDate(strings().dates.weekdaysShort[date.getDay()], date.getDate());
}

/** Desde qué día empieza cada signo, de atrás para adelante. `sign` es la posición en `dates.zodiac`. */
const ZODIAC: { sign: number; emoji: string; from: [number, number] }[] = [
  { sign: 0, emoji: '♑', from: [12, 22] },
  { sign: 11, emoji: '♐', from: [11, 22] },
  { sign: 10, emoji: '♏', from: [10, 23] },
  { sign: 9, emoji: '♎', from: [9, 23] },
  { sign: 8, emoji: '♍', from: [8, 23] },
  { sign: 7, emoji: '♌', from: [7, 23] },
  { sign: 6, emoji: '♋', from: [6, 21] },
  { sign: 5, emoji: '♊', from: [5, 21] },
  { sign: 4, emoji: '♉', from: [4, 20] },
  { sign: 3, emoji: '♈', from: [3, 21] },
  { sign: 2, emoji: '♓', from: [2, 19] },
  { sign: 1, emoji: '♒', from: [1, 20] },
];

export function zodiacSign(day: number, month: number): { name: string; emoji: string } {
  const value = month * 100 + day;
  const z = ZODIAC.find((x) => value >= x.from[0] * 100 + x.from[1]) ?? ZODIAC[0];
  return { name: strings().dates.zodiac[z.sign], emoji: z.emoji };
}

export function isValidDate(day: number, month: number, year?: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year ?? 2024, month); // 2024 es bisiesto: acepta 29/2 sin año
}
