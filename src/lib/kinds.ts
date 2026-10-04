import type { IconKey } from '@/components/icon-data';
import { strings } from '@/i18n/core';

import type { KindId, Recurrence } from './types';

interface KindBase {
  id: KindId;
  /** Ícono dentro de la app. */
  icon: IconKey;
  /** Solo para el texto de las notificaciones (no pueden mostrar SVG). */
  emoji: string;
  /** Es sobre una persona o pareja: muestra saludos, regalos y gustos. */
  person: boolean;
  defaultRecurrence: Recurrence;
  /** Si tiene sentido mostrar cuántos años se cumplen. */
  showsYears: boolean;
}

/** Un tipo de fecha con sus textos en el idioma actual (ver "kinds" en src/i18n). */
export interface KindInfo extends KindBase {
  label: string;
  titleLabel: string;
  titlePlaceholder: string;
  /** "el cumpleaños de Ana", "Pagar el alquiler" */
  phrase: (title: string) => string;
  /** Texto para los años que se cumplen. */
  yearsLabel?: (n: number) => string;
}

const BASE: KindBase[] = [
  { id: 'birthday', icon: 'cake', emoji: '🎂', person: true, defaultRecurrence: 'yearly', showsYears: true },
  { id: 'anniversary', icon: 'rings', emoji: '💍', person: true, defaultRecurrence: 'yearly', showsYears: true },
  { id: 'special', icon: 'sparkle', emoji: '⭐', person: false, defaultRecurrence: 'yearly', showsYears: true },
  { id: 'memorial', icon: 'leaf', emoji: '🕊️', person: false, defaultRecurrence: 'yearly', showsYears: true },
  { id: 'reminder', icon: 'bell', emoji: '🔔', person: false, defaultRecurrence: 'once', showsYears: false },
];

export const KIND_IDS: KindId[] = BASE.map((k) => k.id);

function withTexts(base: KindBase): KindInfo {
  const t = strings().kinds[base.id];
  return { ...base, ...t, yearsLabel: base.showsYears ? t.yearsLabel : undefined };
}

/** Todos los tipos de fecha, con sus textos en el idioma actual. */
export function kinds(): KindInfo[] {
  return BASE.map(withTexts);
}

export function getKind(id: KindId): KindInfo {
  return withTexts(BASE.find((k) => k.id === id) ?? BASE[0]);
}

export const RECURRENCE_IDS: Recurrence[] = ['yearly', 'monthly', 'once'];

export function recurrences(): { id: Recurrence; label: string }[] {
  return RECURRENCE_IDS.map((id) => ({ id, label: strings().recurrences[id] }));
}

export const OFFSET_DAYS = [0, 1, 3, 7, 14, 30];

export function offsetOptions(): { days: number; label: string }[] {
  const o = strings().offsets;
  return OFFSET_DAYS.map((days) => ({ days, label: o[days] }));
}

export function offsetsSummary(offsets: number[]): string {
  const o = strings().offsets;
  if (offsets.length === 0) return o.none;
  return [...offsets]
    .sort((a, b) => a - b)
    .map((d) => o[d] ?? o.other(d))
    .join(' · ');
}

/** Colores mate para etiquetas: terracota, salvia, azul grisáceo, malva, mostaza, eucalipto, rosa viejo, topo. */
export const TAG_COLORS = [
  '#C98A6B',
  '#94A684',
  '#8EA2B0',
  '#B596A3',
  '#CFA45C',
  '#86A69C',
  '#CC9A8C',
  '#A39483',
];

/** Colores de la primera versión → equivalente mate (para migrar datos viejos). */
export const LEGACY_TAG_COLORS: Record<string, string> = {
  '#E07A5F': '#C98A6B',
  '#81B29A': '#94A684',
  '#6C8EBF': '#8EA2B0',
  '#C08BB5': '#B596A3',
  '#E0A940': '#CFA45C',
  '#5FA8B0': '#86A69C',
  '#B5838D': '#CC9A8C',
  '#8D99AE': '#A39483',
};

/** Las notas usan la misma paleta mate que las etiquetas. */
export const NOTE_COLORS = TAG_COLORS;
