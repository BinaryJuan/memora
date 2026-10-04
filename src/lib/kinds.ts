import type { IconKey } from '@/components/icon-data';
import type { KindId, Recurrence } from './types';

export interface KindInfo {
  id: KindId;
  label: string;
  /** Ícono dentro de la app. */
  icon: IconKey;
  /** Solo para el texto de las notificaciones (no pueden mostrar SVG). */
  emoji: string;
  /** Es sobre una persona o pareja: muestra saludos, regalos y gustos. */
  person: boolean;
  defaultRecurrence: Recurrence;
  titleLabel: string;
  titlePlaceholder: string;
  /** "el cumpleaños de Ana", "Pagar el alquiler" */
  phrase: (title: string) => string;
  /** Texto para los años que se cumplen. */
  yearsLabel?: (n: number) => string;
}

export const KINDS: KindInfo[] = [
  {
    id: 'birthday',
    label: 'Cumpleaños',
    icon: 'cake',
    emoji: '🎂',
    person: true,
    defaultRecurrence: 'yearly',
    titleLabel: '¿De quién es el cumple?',
    titlePlaceholder: 'Ej: Ana Pérez',
    phrase: (t) => `el cumpleaños de ${t}`,
    yearsLabel: (n) => `Cumple ${n}`,
  },
  {
    id: 'anniversary',
    label: 'Aniversario',
    icon: 'rings',
    emoji: '💍',
    person: true,
    defaultRecurrence: 'yearly',
    titleLabel: '¿Qué aniversario?',
    titlePlaceholder: 'Ej: Ana y Juan',
    phrase: (t) => `el aniversario de ${t}`,
    yearsLabel: (n) => `${n} ${n === 1 ? 'año' : 'años'}`,
  },
  {
    id: 'special',
    label: 'Fecha especial',
    icon: 'sparkle',
    emoji: '⭐',
    person: false,
    defaultRecurrence: 'yearly',
    titleLabel: '¿Qué fecha es?',
    titlePlaceholder: 'Ej: Día que nos mudamos',
    phrase: (t) => t,
    yearsLabel: (n) => `Se cumplen ${n} ${n === 1 ? 'año' : 'años'}`,
  },
  {
    id: 'memorial',
    label: 'En memoria',
    icon: 'leaf',
    emoji: '🕊️',
    person: false,
    defaultRecurrence: 'yearly',
    titleLabel: '¿A quién recordamos?',
    titlePlaceholder: 'Ej: Abuelo Carlos',
    phrase: (t) => `el recuerdo de ${t}`,
    yearsLabel: (n) => `Se cumplen ${n} ${n === 1 ? 'año' : 'años'}`,
  },
  {
    id: 'reminder',
    label: 'Recordatorio',
    icon: 'bell',
    emoji: '🔔',
    person: false,
    defaultRecurrence: 'once',
    titleLabel: '¿De qué hay que acordarse?',
    titlePlaceholder: 'Ej: Renovar el pasaporte',
    phrase: (t) => t,
  },
];

export function getKind(id: KindId): KindInfo {
  return KINDS.find((k) => k.id === id) ?? KINDS[0];
}

export const RECURRENCES: { id: Recurrence; label: string }[] = [
  { id: 'yearly', label: 'Cada año' },
  { id: 'monthly', label: 'Cada mes' },
  { id: 'once', label: 'Una vez' },
];

export const OFFSET_OPTIONS: { days: number; label: string }[] = [
  { days: 0, label: 'El mismo día' },
  { days: 1, label: '1 día antes' },
  { days: 3, label: '3 días antes' },
  { days: 7, label: '1 semana antes' },
  { days: 14, label: '2 semanas antes' },
  { days: 30, label: '1 mes antes' },
];

export function offsetsSummary(offsets: number[]): string {
  if (offsets.length === 0) return 'Sin avisos';
  return [...offsets]
    .sort((a, b) => a - b)
    .map((d) => OFFSET_OPTIONS.find((o) => o.days === d)?.label ?? `${d} días antes`)
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
