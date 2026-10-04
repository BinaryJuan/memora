import { afterAll, describe, expect, it } from '@jest/globals';

import { setLanguage, stringsFor } from '@/i18n/core';
import { countdownLabel, formatDayMonth, formatEventDate, formatLongDate, weekdayColumn, weekdayInitials } from '../dates';
import { fillTemplate } from '../events';
import { getKind, offsetsSummary } from '../kinds';
import type { MemoraEvent } from '../types';

/** Todas las claves de un objeto de textos, con su tipo ("dates.months": "object", etc.). */
function shape(obj: unknown, prefix = ''): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`];
  if (typeof obj !== 'object' || obj === null) return [`${prefix}:${typeof obj}`];
  return Object.keys(obj)
    .sort()
    .flatMap((k) => shape((obj as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k));
}

const ev = (partial: Partial<MemoraEvent>): MemoraEvent => ({
  id: 'x',
  title: 'Ana Pérez',
  kind: 'birthday',
  day: 4,
  month: 10,
  recurrence: 'yearly',
  tagIds: [],
  giftIdeas: [],
  giftsGiven: [],
  memories: [],
  greetedOn: [],
  createdAt: 0,
  ...partial,
});

afterAll(() => setLanguage('es'));

describe('idiomas', () => {
  it('inglés tiene exactamente los mismos textos que español', () => {
    expect(shape(stringsFor('en'))).toEqual(shape(stringsFor('es')));
  });

  it('fechas en español', () => {
    setLanguage('es');
    expect(formatDayMonth(4, 10)).toBe('4 de octubre');
    expect(formatLongDate(new Date(2026, 9, 4))).toBe('Domingo 4 de octubre');
    expect(formatEventDate(ev({ year: 2000 }))).toBe('4 de octubre de 2000');
    expect(countdownLabel(3)).toBe('En 3 días');
    expect(weekdayInitials()[0]).toBe('L'); // la semana empieza el lunes
    expect(weekdayColumn(0)).toBe(6); // el domingo va al final
  });

  it('fechas en inglés', () => {
    setLanguage('en');
    expect(formatDayMonth(4, 10)).toBe('October 4');
    expect(formatLongDate(new Date(2026, 9, 4))).toBe('Sunday, October 4');
    expect(formatEventDate(ev({ year: 2000 }))).toBe('October 4, 2000');
    expect(formatEventDate(ev({ recurrence: 'monthly', day: 22 }))).toBe('The 22nd of every month');
    expect(formatEventDate(ev({ recurrence: 'monthly', day: 11 }))).toBe('The 11th of every month');
    expect(countdownLabel(1)).toBe('Tomorrow');
    expect(weekdayInitials()[0]).toBe('S'); // la semana empieza el domingo
    expect(weekdayColumn(0)).toBe(0);
  });

  it('tipos de fecha y avisos en inglés', () => {
    setLanguage('en');
    expect(getKind('birthday').phrase('Ana')).toBe("Ana's birthday");
    expect(getKind('birthday').yearsLabel?.(30)).toBe('Turns 30');
    expect(getKind('reminder').yearsLabel).toBeUndefined();
    expect(offsetsSummary([7, 0])).toBe('On the day · 1 week before');
  });

  it('los mensajes de saludo aceptan {nombre}/{edad} y {name}/{age}', () => {
    const e = ev({ title: 'Ana Pérez' });
    expect(fillTemplate('¡Feliz cumple, {nombre}! Que los {edad} te encuentren bien', e, 30)).toBe(
      '¡Feliz cumple, Ana! Que los 30 te encuentren bien',
    );
    expect(fillTemplate('Happy birthday, {name}! Hope {age} looks great', e, 30)).toBe('Happy birthday, Ana! Hope 30 looks great');
    expect(fillTemplate('Happy birthday, {name}!', e, null)).toBe('Happy birthday, Ana!');
  });
});
