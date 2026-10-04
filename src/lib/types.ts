import type { IconKey } from '@/components/icon-data';

export type KindId = 'birthday' | 'anniversary' | 'special' | 'memorial' | 'reminder';
export type Recurrence = 'yearly' | 'monthly' | 'once';
export type ThemeMode = 'system' | 'light' | 'dark';
export type LanguagePref = 'system' | 'es' | 'en';

export interface GiftIdea {
  id: string;
  text: string;
  budget?: number;
}

export interface GiftGiven {
  id: string;
  year: number;
  text: string;
}

export interface Memory {
  id: string;
  year: number;
  text: string;
  photoUri?: string;
}

export interface MemoraEvent {
  id: string;
  title: string;
  kind: KindId;
  day: number;
  /** 1-12 */
  month: number;
  year?: number;
  recurrence: Recurrence;
  tagIds: string[];
  /** Ícono elegido. Si no hay: iniciales (personas) o el ícono del tipo de fecha. */
  icon?: IconKey;
  phone?: string;
  notes?: string;
  likes?: string;
  /** Días de anticipación. `undefined` = hereda de la etiqueta o de los ajustes. */
  reminderOffsets?: number[];
  giftIdeas: GiftIdea[];
  giftsGiven: GiftGiven[];
  memories: Memory[];
  /** Fechas (YYYY-MM-DD) en las que ya se saludó. */
  greetedOn: string[];
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  icon: IconKey;
  color: string;
  reminderOffsets?: number[];
}

export interface Template {
  id: string;
  text: string;
}

export interface Settings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  notifyHour: number;
  defaultOffsets: number[];
  weeklySummary: boolean;
  lockEnabled: boolean;
  /** Ya vio la bienvenida. */
  onboarded: boolean;
  /** 'system' sigue el idioma del teléfono. */
  language: LanguagePref;
  /** Sonidito al abrir la app los días de cumple. */
  birthdaySound: boolean;
}

/** Nota suelta, al estilo Google Keep (no está atada a ninguna fecha). */
export interface Note {
  id: string;
  title: string;
  text: string;
  /** Uno de NOTE_COLORS, o undefined para el color de fondo normal. */
  color?: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BackupData {
  app: 'memora';
  version: 1;
  exportedAt: string;
  events: MemoraEvent[];
  tags: Tag[];
  templates: Template[];
  /** Desde que existen las notas. Los respaldos viejos no la traen. */
  notes?: Note[];
  settings: Settings;
}
