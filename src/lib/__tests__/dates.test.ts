import { describe, expect, it } from '@jest/globals';

import {
  daysBetween,
  isMilestone,
  isValidDate,
  nextOccurrence,
  nextOccurrences,
  occurrenceInMonth,
  yearsAt,
  zodiacSign,
} from '../dates';
import type { MemoraEvent } from '../types';

function ev(partial: Partial<MemoraEvent>): MemoraEvent {
  return {
    id: 'x',
    title: 'Prueba',
    kind: 'birthday',
    day: 1,
    month: 1,
    recurrence: 'yearly',
    tagIds: [],
    giftIdeas: [],
    giftsGiven: [],
    memories: [],
    greetedOn: [],
    createdAt: 0,
    ...partial,
  };
}

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('nextOccurrence', () => {
  it('cuenta el mismo día como próxima vez', () => {
    expect(nextOccurrence(ev({ day: 3, month: 10 }), d(2026, 10, 3))).toEqual(d(2026, 10, 3));
  });

  it('pasa al año siguiente si ya pasó', () => {
    expect(nextOccurrence(ev({ day: 2, month: 10 }), d(2026, 10, 3))).toEqual(d(2027, 10, 2));
  });

  it('el 29 de febrero cae el 28 en años no bisiestos', () => {
    expect(nextOccurrence(ev({ day: 29, month: 2 }), d(2026, 10, 3))).toEqual(d(2027, 2, 28));
    expect(nextOccurrence(ev({ day: 29, month: 2 }), d(2027, 3, 1))).toEqual(d(2028, 2, 29));
  });

  it('"el 31 de cada mes" cae el último día en meses cortos', () => {
    const e = ev({ day: 31, recurrence: 'monthly' });
    expect(nextOccurrence(e, d(2026, 11, 2))).toEqual(d(2026, 11, 30));
    expect(nextOccurrences(e, 3, d(2027, 1, 31))).toEqual([d(2027, 1, 31), d(2027, 2, 28), d(2027, 3, 31)]);
  });

  it('una sola vez: devuelve null cuando ya pasó', () => {
    const e = ev({ day: 15, month: 11, year: 2026, recurrence: 'once', kind: 'reminder' });
    expect(nextOccurrence(e, d(2026, 10, 3))).toEqual(d(2026, 11, 15));
    expect(nextOccurrence(e, d(2026, 11, 16))).toBeNull();
  });

  it('una sola vez muy en el futuro igual se encuentra', () => {
    const e = ev({ day: 1, month: 6, year: 2031, recurrence: 'once', kind: 'reminder' });
    expect(nextOccurrence(e, d(2026, 10, 3))).toEqual(d(2031, 6, 1));
  });

  it('no inventa ocurrencias antes del año de inicio', () => {
    const e = ev({ day: 10, month: 3, year: 2028, kind: 'anniversary' });
    expect(nextOccurrence(e, d(2026, 10, 3))).toEqual(d(2028, 3, 10));
    expect(occurrenceInMonth(e, 2027, 3)).toBeNull();
  });
});

describe('años y fechas redondas', () => {
  it('calcula los años que se cumplen', () => {
    expect(yearsAt(ev({ year: 1996 }), d(2026, 10, 3))).toBe(30);
    expect(yearsAt(ev({}), d(2026, 10, 3))).toBeNull();
    expect(yearsAt(ev({ year: 2026 }), d(2026, 10, 3))).toBeNull();
  });

  it('marca los números redondos', () => {
    expect([18, 30, 50, 75, 100].every(isMilestone)).toBe(true);
    expect([17, 23, 31].some(isMilestone)).toBe(false);
    expect(isMilestone(null)).toBe(false);
  });
});

describe('utilidades', () => {
  it('cuenta días aunque cambie el horario de verano', () => {
    expect(daysBetween(d(2026, 10, 3), d(2026, 11, 15))).toBe(43);
    expect(daysBetween(new Date(2026, 9, 3, 23, 59), d(2026, 10, 4))).toBe(1);
  });

  it('valida fechas', () => {
    expect(isValidDate(29, 2)).toBe(true);
    expect(isValidDate(29, 2, 2027)).toBe(false);
    expect(isValidDate(31, 4)).toBe(false);
    expect(isValidDate(0, 1)).toBe(false);
    expect(isValidDate(1, 13)).toBe(false);
  });

  it('signos en los bordes', () => {
    expect(zodiacSign(22, 12).name).toBe('Capricornio');
    expect(zodiacSign(19, 1).name).toBe('Capricornio');
    expect(zodiacSign(20, 1).name).toBe('Acuario');
    expect(zodiacSign(23, 9).name).toBe('Libra');
  });
});
