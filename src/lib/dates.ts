import type { MemoraEvent } from './types';

const DAY_MS = 86_400_000;

export const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
/** Semana empezando el lunes. */
export const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}

export function shortCountdown(days: number): string {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}

export function formatDayMonth(day: number, month: number): string {
  return `${day} de ${MONTHS[month - 1]}`;
}

export function formatEventDate(e: MemoraEvent): string {
  if (e.recurrence === 'monthly') return `El ${e.day} de cada mes`;
  const base = formatDayMonth(e.day, e.month);
  return e.year ? `${base} de ${e.year}` : base;
}

export function formatLongDate(d: Date): string {
  return `${capitalize(WEEKDAYS[d.getDay()])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

export function formatShortDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()].slice(0, 3)} ${d.getDate()}`;
}

const ZODIAC: { name: string; emoji: string; from: [number, number] }[] = [
  { name: 'Capricornio', emoji: '♑', from: [12, 22] },
  { name: 'Sagitario', emoji: '♐', from: [11, 22] },
  { name: 'Escorpio', emoji: '♏', from: [10, 23] },
  { name: 'Libra', emoji: '♎', from: [9, 23] },
  { name: 'Virgo', emoji: '♍', from: [8, 23] },
  { name: 'Leo', emoji: '♌', from: [7, 23] },
  { name: 'Cáncer', emoji: '♋', from: [6, 21] },
  { name: 'Géminis', emoji: '♊', from: [5, 21] },
  { name: 'Tauro', emoji: '♉', from: [4, 20] },
  { name: 'Aries', emoji: '♈', from: [3, 21] },
  { name: 'Piscis', emoji: '♓', from: [2, 19] },
  { name: 'Acuario', emoji: '♒', from: [1, 20] },
];

export function zodiacSign(day: number, month: number): { name: string; emoji: string } {
  const value = month * 100 + day;
  const sign = ZODIAC.find((z) => value >= z.from[0] * 100 + z.from[1]);
  return sign ?? ZODIAC[0];
}

export function isValidDate(day: number, month: number, year?: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year ?? 2024, month); // 2024 es bisiesto: acepta 29/2 sin año
}
