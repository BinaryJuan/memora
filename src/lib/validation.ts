import { isIconKey, type IconKey } from '@/components/icon-data';
import { isValidDate } from './dates';
import { strings } from '@/i18n/core';
import { KIND_IDS, LEGACY_TAG_COLORS, NOTE_COLORS, OFFSET_DAYS, RECURRENCE_IDS, TAG_COLORS } from './kinds';
import type {
  BackupData,
  GiftGiven,
  GiftIdea,
  KindId,
  LanguagePref,
  Memory,
  MemoraEvent,
  Note,
  Settings,
  Tag,
  Template,
  ThemeMode,
} from './types';

/** Largos máximos. Se usan en los formularios (maxLength) y al importar respaldos. */
export const LIMITS = {
  title: 80,
  notes: 1000,
  likes: 500,
  phone: 32,
  gift: 120,
  budget: 1_000_000_000,
  tagName: 24,
  template: 500,
  memory: 1000,
  events: 5000,
  tags: 50,
  templates: 30,
  listItems: 200,
  noteTitle: 120,
  noteText: 5000,
  noteCount: 2000,
  backupBytes: 5 * 1024 * 1024,
};

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2200;

const THEMES: ThemeMode[] = ['system', 'light', 'dark'];
const LANGUAGES: LanguagePref[] = ['system', 'es', 'en'];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_CHARS = /^[\d+\s().-]+$/;

/* ---------- Formularios ---------- */

/** Deja solo números (para día, año y presupuesto). */
export function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/** Un teléfono razonable: solo números y separadores, entre 6 y 15 dígitos. */
export function isValidPhone(phone: string): boolean {
  const digits = digitsOnly(phone);
  return PHONE_CHARS.test(phone) && digits.length >= 6 && digits.length <= 15;
}

/** Interpreta "1.500", "1500,50" o "1500" como número. Devuelve null si no es válido. */
export function parseBudget(input: string): number | null {
  const s = input.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (!s) return null;
  // Formato argentino: el punto separa miles y la coma los decimales.
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/\.(?=\d{3}(\D|$))/g, '');
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 && n <= LIMITS.budget ? Math.round(n * 100) / 100 : null;
}

/* ---------- Limpieza de datos que vienen de afuera ---------- */

type Raw = Record<string, unknown>;

const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim().slice(0, max);
  return s || undefined;
}

function int(v: unknown, min: number, max: number): number | undefined {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : undefined;
}

function oneOf<T extends string>(v: unknown, options: readonly T[], fallback: T): T {
  return options.includes(v as T) ? (v as T) : fallback;
}

function list(v: unknown, max: number): unknown[] {
  return Array.isArray(v) ? v.slice(0, max) : [];
}

function id(v: unknown, fallback: () => string): string {
  return typeof v === 'string' && /^[\w-]{1,64}$/.test(v) ? v : fallback();
}

let seq = 0;
const freshId = () => `imp${Date.now().toString(36)}${(seq++).toString(36)}`;

function offsets(v: unknown): number[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return [...new Set(v.filter((d): d is number => OFFSET_DAYS.includes(d as number)))].sort((a, b) => a - b);
}

/** Las etiquetas de la primera versión usaban emojis y colores más saturados. */
const LEGACY_EMOJI_ICONS: Record<string, IconKey> = {
  '🏠': 'house', '🤝': 'friends', '💼': 'briefcase', '❤️': 'heart', '🎓': 'cap', '⚽': 'ball',
  '🎵': 'music', '🐶': 'paw', '👶': 'rattle', '✈️': 'plane', '⭐': 'star', '🍷': 'wine',
  '🏋️': 'dumbbell', '📚': 'book', '🎮': 'gamepad', '🌱': 'sprout',
};

export function normalizeTag(t: Tag & { emoji?: string }): Tag {
  const { emoji, ...rest } = t;
  return {
    ...rest,
    icon: isIconKey(t.icon) ? t.icon : (LEGACY_EMOJI_ICONS[emoji ?? ''] ?? 'star'),
    color: LEGACY_TAG_COLORS[t.color] ?? t.color,
  };
}

function cleanTag(v: unknown, i: number): Tag | null {
  if (!isObj(v)) return null;
  const name = str(v.name, LIMITS.tagName);
  if (!name) return null;
  const base = normalizeTag({
    id: id(v.id, freshId),
    name,
    icon: v.icon as IconKey,
    color: typeof v.color === 'string' ? v.color : '',
    emoji: typeof v.emoji === 'string' ? v.emoji : undefined,
  });
  return {
    ...base,
    color: HEX_COLOR.test(base.color) ? base.color : TAG_COLORS[i % TAG_COLORS.length],
    reminderOffsets: offsets(v.reminderOffsets),
  };
}

function cleanGiftIdea(v: unknown): GiftIdea | null {
  if (!isObj(v)) return null;
  const text = str(v.text, LIMITS.gift);
  if (!text) return null;
  const budget = typeof v.budget === 'number' && Number.isFinite(v.budget) && v.budget >= 0 && v.budget <= LIMITS.budget;
  return { id: id(v.id, freshId), text, budget: budget ? (v.budget as number) : undefined };
}

function cleanGiftGiven(v: unknown): GiftGiven | null {
  if (!isObj(v)) return null;
  const text = str(v.text, LIMITS.gift);
  const year = int(v.year, MIN_YEAR, MAX_YEAR);
  return text && year ? { id: id(v.id, freshId), text, year } : null;
}

function cleanMemory(v: unknown, photoPrefix: string | null): Memory | null {
  if (!isObj(v)) return null;
  const year = int(v.year, MIN_YEAR, MAX_YEAR);
  const text = str(v.text, LIMITS.memory) ?? '';
  // Solo aceptamos fotos que estén dentro de la carpeta de la app.
  const photo =
    photoPrefix && typeof v.photoUri === 'string' && v.photoUri.startsWith(photoPrefix) && !v.photoUri.includes('..')
      ? v.photoUri
      : undefined;
  if (!year || (!text && !photo)) return null;
  return { id: id(v.id, freshId), year, text, photoUri: photo };
}

function cleanEvent(v: unknown, tagIds: Set<string>, photoPrefix: string | null): MemoraEvent | null {
  if (!isObj(v)) return null;
  const title = str(v.title, LIMITS.title);
  const kind = oneOf<KindId>(v.kind, KIND_IDS, 'special');
  const recurrence = oneOf(v.recurrence, RECURRENCE_IDS, 'yearly');
  const day = int(v.day, 1, 31);
  const month = int(v.month, 1, 12);
  const year = int(v.year, MIN_YEAR, MAX_YEAR);
  if (!title || !day || !month) return null;
  if (recurrence !== 'monthly' && !isValidDate(day, month, year)) return null;
  if (recurrence === 'once' && !year) return null;

  const phone = str(v.phone, LIMITS.phone);
  return {
    id: id(v.id, freshId),
    title,
    kind,
    day,
    month,
    year,
    recurrence,
    tagIds: [...new Set(list(v.tagIds, LIMITS.tags).filter((t): t is string => typeof t === 'string' && tagIds.has(t)))],
    icon: isIconKey(v.icon) ? v.icon : undefined,
    phone: phone && isValidPhone(phone) ? phone : undefined,
    notes: str(v.notes, LIMITS.notes),
    likes: str(v.likes, LIMITS.likes),
    reminderOffsets: offsets(v.reminderOffsets),
    giftIdeas: list(v.giftIdeas, LIMITS.listItems).map(cleanGiftIdea).filter((g): g is GiftIdea => g !== null),
    giftsGiven: list(v.giftsGiven, LIMITS.listItems).map(cleanGiftGiven).filter((g): g is GiftGiven => g !== null),
    memories: list(v.memories, LIMITS.listItems)
      .map((m) => cleanMemory(m, photoPrefix))
      .filter((m): m is Memory => m !== null),
    greetedOn: [...new Set(list(v.greetedOn, 500).filter((k): k is string => typeof k === 'string' && DATE_KEY.test(k)))],
    createdAt: typeof v.createdAt === 'number' && Number.isFinite(v.createdAt) ? v.createdAt : Date.now(),
  };
}

function cleanSettings(v: unknown, fallback: Settings): Settings {
  if (!isObj(v)) return fallback;
  return {
    theme: oneOf(v.theme, THEMES, fallback.theme),
    notificationsEnabled: typeof v.notificationsEnabled === 'boolean' ? v.notificationsEnabled : fallback.notificationsEnabled,
    notifyHour: int(v.notifyHour, 0, 23) ?? fallback.notifyHour,
    defaultOffsets: offsets(v.defaultOffsets) ?? fallback.defaultOffsets,
    weeklySummary: typeof v.weeklySummary === 'boolean' ? v.weeklySummary : fallback.weeklySummary,
    // El bloqueo nunca se toma de un archivo: lo decide quien usa este teléfono.
    lockEnabled: fallback.lockEnabled,
    onboarded: fallback.onboarded,
    // El idioma tampoco: es el de quien está usando la app ahora.
    language: oneOf(fallback.language, LANGUAGES, 'system'),
    birthdaySound: typeof v.birthdaySound === 'boolean' ? v.birthdaySound : fallback.birthdaySound,
  };
}

function cleanNote(v: unknown): Note | null {
  if (!isObj(v)) return null;
  const title = str(v.title, LIMITS.noteTitle) ?? '';
  const text = str(v.text, LIMITS.noteText) ?? '';
  if (!title && !text) return null;
  const time = (t: unknown) => (typeof t === 'number' && Number.isFinite(t) && t > 0 ? t : Date.now());
  const color = typeof v.color === 'string' && NOTE_COLORS.includes(v.color) ? v.color : undefined;
  return {
    id: id(v.id, freshId),
    title,
    text,
    color,
    pinned: v.pinned === true,
    createdAt: time(v.createdAt),
    updatedAt: time(v.updatedAt),
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.map((it) => {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      return it;
    }
    const copy = { ...it, id: freshId() };
    seen.add(copy.id);
    return copy;
  });
}

export class BackupError extends Error {}

/**
 * Valida y limpia un respaldo leído de un archivo. Lo que no se puede arreglar se descarta;
 * si el archivo directamente no es de Memora, tira BackupError.
 */
export function sanitizeBackup(raw: unknown, currentSettings: Settings, photoPrefix: string | null): BackupData {
  if (!isObj(raw) || raw.app !== 'memora' || !Array.isArray(raw.events)) {
    throw new BackupError(strings().backup.notMemora);
  }
  if (typeof raw.version === 'number' && raw.version > 1) {
    throw new BackupError(strings().backup.newer);
  }

  const tags = dedupeById(
    list(raw.tags, LIMITS.tags)
      .map(cleanTag)
      .filter((t): t is Tag => t !== null),
  );
  const tagIds = new Set(tags.map((t) => t.id));
  const events = dedupeById(
    list(raw.events, LIMITS.events)
      .map((e) => cleanEvent(e, tagIds, photoPrefix))
      .filter((e): e is MemoraEvent => e !== null),
  );
  const templates = dedupeById(
    list(raw.templates, LIMITS.templates)
      .map((t): Template | null => {
        const text = isObj(t) ? str(t.text, LIMITS.template) : undefined;
        return text && isObj(t) ? { id: id(t.id, freshId), text } : null;
      })
      .filter((t): t is Template => t !== null),
  );

  const notes = dedupeById(
    list(raw.notes, LIMITS.noteCount)
      .map(cleanNote)
      .filter((n): n is Note => n !== null),
  );

  return {
    app: 'memora',
    version: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
    events,
    tags,
    templates,
    notes,
    settings: cleanSettings(raw.settings, currentSettings),
  };
}
