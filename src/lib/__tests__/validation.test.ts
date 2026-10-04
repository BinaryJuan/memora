import { describe, expect, it } from '@jest/globals';

import { fillTemplate, initials } from '../events';
import type { MemoraEvent, Settings } from '../types';
import { BackupError, isValidPhone, LIMITS, parseBudget, sanitizeBackup } from '../validation';

const settings: Settings = {
  theme: 'system',
  notificationsEnabled: true,
  notifyHour: 9,
  defaultOffsets: [0, 1, 7],
  weeklySummary: true,
  lockEnabled: true,
  onboarded: true,
};
const PHOTOS = 'file:///data/user/0/com.memora/files/fotos/';

const validEvent = { id: 'a1', title: 'Lucía', kind: 'birthday', day: 3, month: 10, year: 1996, recurrence: 'yearly' };
const backup = (over: Record<string, unknown> = {}) => ({
  app: 'memora',
  version: 1,
  events: [validEvent],
  tags: [{ id: 'amigos', name: 'Amigos', icon: 'friends', color: '#94A684' }],
  templates: [{ id: 't1', text: 'Hola {nombre}' }],
  settings,
  ...over,
});

describe('sanitizeBackup', () => {
  it('rechaza archivos que no son de Memora', () => {
    expect(() => sanitizeBackup(null, settings, PHOTOS)).toThrow(BackupError);
    expect(() => sanitizeBackup([], settings, PHOTOS)).toThrow(BackupError);
    expect(() => sanitizeBackup({ app: 'otra', events: [] }, settings, PHOTOS)).toThrow(BackupError);
    expect(() => sanitizeBackup(backup({ version: 9 }), settings, PHOTOS)).toThrow(/versión más nueva/);
  });

  it('deja pasar un respaldo correcto y completa los campos que faltan', () => {
    const out = sanitizeBackup(backup(), settings, PHOTOS);
    expect(out.events).toHaveLength(1);
    expect(out.events[0]).toMatchObject({ title: 'Lucía', giftIdeas: [], memories: [], greetedOn: [] });
  });

  it('descarta fechas imposibles o sin nombre', () => {
    const out = sanitizeBackup(
      backup({
        events: [
          validEvent,
          { ...validEvent, id: 'b', day: 31, month: 2 },
          { ...validEvent, id: 'c', title: '   ' },
          { ...validEvent, id: 'd', month: '10' },
          { ...validEvent, id: 'e', recurrence: 'once', year: undefined },
          'basura',
          null,
        ],
      }),
      settings,
      PHOTOS,
    );
    expect(out.events.map((e: MemoraEvent) => e.id)).toEqual(['a1']);
  });

  it('recorta textos largos y limpia teléfonos y listas', () => {
    const out = sanitizeBackup(
      backup({
        events: [
          {
            ...validEvent,
            title: 'x'.repeat(500),
            phone: '<script>',
            tagIds: ['amigos', 'no-existe', 42],
            reminderOffsets: [1, 999, 1, 'a'],
            giftIdeas: [{ text: 'Libro', budget: -5 }, { text: '' }],
            greetedOn: ['2026-10-03', 'ayer'],
          },
        ],
      }),
      settings,
      PHOTOS,
    );
    const e = out.events[0];
    expect(e.title).toHaveLength(LIMITS.title);
    expect(e.phone).toBeUndefined();
    expect(e.tagIds).toEqual(['amigos']);
    expect(e.reminderOffsets).toEqual([1]);
    expect(e.giftIdeas).toEqual([expect.objectContaining({ text: 'Libro', budget: undefined })]);
    expect(e.greetedOn).toEqual(['2026-10-03']);
  });

  it('solo acepta fotos dentro de la carpeta de la app', () => {
    const out = sanitizeBackup(
      backup({
        events: [
          {
            ...validEvent,
            memories: [
              { year: 2025, text: 'ok', photoUri: `${PHOTOS}a.jpg` },
              { year: 2024, text: 'afuera', photoUri: 'file:///sdcard/otra.jpg' },
              { year: 2023, text: 'truco', photoUri: `${PHOTOS}../../databases/x` },
            ],
          },
        ],
      }),
      settings,
      PHOTOS,
    );
    expect(out.events[0].memories.map((m) => m.photoUri)).toEqual([`${PHOTOS}a.jpg`, undefined, undefined]);
  });

  it('nunca toma el bloqueo del archivo y arregla ajustes inválidos', () => {
    const out = sanitizeBackup(
      backup({ settings: { lockEnabled: false, notifyHour: 99, theme: 'neon', defaultOffsets: 'x' } }),
      settings,
      PHOTOS,
    );
    expect(out.settings).toEqual(settings);
  });

  it('convierte etiquetas viejas con emoji y colores inválidos', () => {
    const out = sanitizeBackup(
      backup({ tags: [{ id: 'f', name: 'Familia', emoji: '🏠', color: '#E07A5F' }, { id: 'g', name: 'G', color: 'red' }] }),
      settings,
      PHOTOS,
    );
    expect(out.tags[0]).toMatchObject({ icon: 'house', color: '#C98A6B' });
    expect(out.tags[1].color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('no deja ids repetidos', () => {
    const out = sanitizeBackup(backup({ events: [validEvent, validEvent] }), settings, PHOTOS);
    expect(new Set(out.events.map((e) => e.id)).size).toBe(2);
  });
});

describe('formularios', () => {
  it('teléfonos', () => {
    expect(isValidPhone('+54 9 11 1234-5678')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('+54 abc 1234 5678')).toBe(false);
  });

  it('presupuestos con formato argentino', () => {
    expect(parseBudget('15000')).toBe(15000);
    expect(parseBudget('$ 15.000')).toBe(15000);
    expect(parseBudget('1.500,50')).toBe(1500.5);
    expect(parseBudget('1500.5')).toBe(1500.5);
    expect(parseBudget('-3')).toBeNull();
    expect(parseBudget('mucho')).toBeNull();
  });
});

describe('mensajes', () => {
  const e = { title: 'Lucía Fernández' } as MemoraEvent;

  it('completa nombre y edad', () => {
    expect(fillTemplate('¡Feliz cumple, {nombre}! Que los {edad} sean geniales', e, 30)).toBe(
      '¡Feliz cumple, Lucía! Que los 30 sean geniales',
    );
  });

  it('si no sabe la edad, la saca sin dejar huecos', () => {
    expect(fillTemplate('Que los {edad} te encuentren bien', e, null)).toBe('Que te encuentren bien');
  });

  it('iniciales sin conectores', () => {
    expect(initials('Martín y Sofi')).toBe('MS');
    expect(initials('  ')).toBe('?');
  });
});
