import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { BackupData, MemoraEvent, Settings, Tag, Template } from '@/lib/types';
import { normalizeTag } from '@/lib/validation';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_TAGS: Tag[] = [
  { id: 'familia', name: 'Familia', icon: 'house', color: '#C98A6B' },
  { id: 'amigos', name: 'Amigos', icon: 'friends', color: '#94A684' },
  { id: 'trabajo', name: 'Trabajo', icon: 'briefcase', color: '#8EA2B0' },
  { id: 'pareja', name: 'Pareja', icon: 'heart', color: '#B596A3' },
];

/**
 * Si lo guardado está roto (no es JSON válido), lo copiamos aparte antes de seguir.
 * Si no, la app arrancaría vacía y al primer cambio pisaría los datos para siempre.
 */
const safeStorage: StateStorage = {
  getItem: async (name) => {
    const raw = await AsyncStorage.getItem(name);
    if (raw === null) return null;
    try {
      JSON.parse(raw);
      return raw;
    } catch {
      await AsyncStorage.setItem(`${name}-danado-${Date.now()}`, raw);
      return null;
    }
  },
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
};

const DEFAULT_TEMPLATES: Template[] = [
  { id: 't1', text: '¡Feliz cumple, {nombre}! 🎉 Que tengas un día hermoso.' },
  { id: 't2', text: '¡Feliz cumpleaños, {nombre}! Que los {edad} te encuentren genial. ¡Un abrazo grande! 🥳' },
  { id: 't3', text: '¡Muy feliz día, {nombre}! Te mando un abrazo enorme. 💛' },
];

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  notificationsEnabled: true,
  /** Medianoche: el aviso del mismo día llega apenas empieza, con todo el día por delante. */
  notifyHour: 0,
  defaultOffsets: [0, 1, 7],
  weeklySummary: true,
  lockEnabled: false,
  onboarded: false,
};

export type NewEvent = Omit<MemoraEvent, 'id' | 'createdAt' | 'giftIdeas' | 'giftsGiven' | 'memories' | 'greetedOn'> &
  Partial<Pick<MemoraEvent, 'giftIdeas' | 'giftsGiven' | 'memories' | 'greetedOn'>>;

interface State {
  events: MemoraEvent[];
  tags: Tag[];
  templates: Template[];
  settings: Settings;
  hydrated: boolean;

  addEvent: (e: NewEvent) => string;
  addEvents: (list: NewEvent[]) => void;
  updateEvent: (id: string, patch: Partial<MemoraEvent>) => void;
  deleteEvent: (id: string) => void;
  /** Vuelve a poner una fecha borrada (para "Deshacer"). */
  restoreEvent: (event: MemoraEvent) => void;
  toggleGreeted: (id: string, key: string) => void;

  saveTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;

  saveTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  importBackup: (data: BackupData, mode: 'replace' | 'merge') => void;
}

function buildEvent(e: NewEvent): MemoraEvent {
  return {
    giftIdeas: [],
    giftsGiven: [],
    memories: [],
    greetedOn: [],
    ...e,
    id: newId(),
    createdAt: Date.now(),
  };
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      events: [],
      tags: DEFAULT_TAGS,
      templates: DEFAULT_TEMPLATES,
      settings: DEFAULT_SETTINGS,
      hydrated: false,

      addEvent: (e) => {
        const ev = buildEvent(e);
        set((s) => ({ events: [...s.events, ev] }));
        return ev.id;
      },
      addEvents: (list) => set((s) => ({ events: [...s.events, ...list.map(buildEvent)] })),
      updateEvent: (id, patch) =>
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
      restoreEvent: (event) =>
        set((s) => (s.events.some((e) => e.id === event.id) ? s : { events: [...s.events, event] })),
      toggleGreeted: (id, key) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id !== id
              ? e
              : {
                  ...e,
                  greetedOn: e.greetedOn.includes(key)
                    ? e.greetedOn.filter((k) => k !== key)
                    : [...e.greetedOn, key],
                },
          ),
        })),

      saveTag: (tag) =>
        set((s) => ({
          tags: s.tags.some((t) => t.id === tag.id)
            ? s.tags.map((t) => (t.id === tag.id ? tag : t))
            : [...s.tags, tag],
        })),
      deleteTag: (id) =>
        set((s) => ({
          tags: s.tags.filter((t) => t.id !== id),
          events: s.events.map((e) =>
            e.tagIds.includes(id) ? { ...e, tagIds: e.tagIds.filter((t) => t !== id) } : e,
          ),
        })),

      saveTemplate: (t) =>
        set((s) => ({
          templates: s.templates.some((x) => x.id === t.id)
            ? s.templates.map((x) => (x.id === t.id ? t : x))
            : [...s.templates, t],
        })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      // `data` tiene que venir ya limpio de sanitizeBackup().
      importBackup: (data, mode) =>
        set((s) => {
          if (mode === 'replace') {
            return {
              events: data.events,
              tags: data.tags,
              templates: data.templates,
              settings: { ...DEFAULT_SETTINGS, ...data.settings, lockEnabled: s.settings.lockEnabled, onboarded: true },
            };
          }
          const eventIds = new Set(s.events.map((e) => e.id));
          const tagIds = new Set(s.tags.map((t) => t.id));
          const tplIds = new Set(s.templates.map((t) => t.id));
          return {
            events: [...s.events, ...data.events.filter((e) => !eventIds.has(e.id))],
            tags: [...s.tags, ...data.tags.filter((t) => !tagIds.has(t.id))],
            templates: [...s.templates, ...data.templates.filter((t) => !tplIds.has(t.id))],
          };
        }),
    }),
    {
      name: 'memora-data',
      version: 5,
      migrate: (persisted, version) => {
        const state = persisted as {
          tags?: Tag[];
          events?: (MemoraEvent & { photoUri?: string })[];
          settings?: Partial<Settings>;
        };
        // v2: etiquetas con íconos SVG en lugar de emojis.
        if (version < 2 && state.tags) state.tags = state.tags.map(normalizeTag);
        // v3: las fechas ya no tienen foto (se elige un ícono).
        if (version < 3 && state.events) state.events = state.events.map(({ photoUri: _photo, ...e }) => e);
        // v4: bienvenida nueva. Quien ya usaba la app no tiene por qué verla.
        if (version < 4) state.settings = { ...DEFAULT_SETTINGS, ...state.settings, onboarded: true };
        // v5: los avisos pasan de las 9 a las 00:00. Solo se cambia si seguía el horario de antes.
        if (version < 5 && state.settings?.notifyHour === 9) state.settings = { ...state.settings, notifyHour: 0 };
        return state as State;
      },
      // Ajustes nuevos que no estaban en lo guardado toman su valor por defecto.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, settings: { ...current.settings, ...p.settings } };
      },
      storage: createJSONStorage(() => safeStorage),
      partialize: ({ events, tags, templates, settings }) => ({ events, tags, templates, settings }),
      onRehydrateStorage: () => () => {
        useStore.setState({ hydrated: true });
      },
    },
  ),
);
