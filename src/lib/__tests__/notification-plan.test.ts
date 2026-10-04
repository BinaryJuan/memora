import { describe, expect, it } from '@jest/globals';

import { planAll, splitPlan } from '../notification-plan';
import type { MemoraEvent, Settings } from '../types';

const settings: Settings = {
  theme: 'system',
  notificationsEnabled: true,
  notifyHour: 0,
  defaultOffsets: [0, 1, 7],
  weeklySummary: false,
  lockEnabled: false,
  onboarded: true,
};

function ev(partial: Partial<MemoraEvent>): MemoraEvent {
  return {
    id: 'lu',
    title: 'Lucía',
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
  };
}

const at = (m: number, day: number, h: number, min = 0) => new Date(2026, m - 1, day, h, min);
const plan = (events: MemoraEvent[], now: Date, handled: string[] = [], s: Settings = settings) =>
  splitPlan(planAll(events, [], s, now), handled, now, 400);

describe('avisos', () => {
  it('una fecha de hoy cargada después de la hora del aviso se avisa igual, una sola vez', () => {
    const now = at(10, 4, 10); // el cumple es hoy y el aviso era a las 00:00
    const first = plan([ev({})], now);
    expect(first.catchUp.map((p) => p.key)).toEqual(['2026-10-04|lu|0']);
    expect(first.catchUp[0].greet).toBe(true);
    // Al reprogramar de nuevo (por cualquier cambio) no se repite.
    const again = plan([ev({})], at(10, 4, 11), first.handled);
    expect(again.catchUp).toEqual([]);
  });

  it('no repite lo que Android ya tenía programado antes de su hora', () => {
    const yesterday = plan([ev({})], at(10, 3, 20));
    expect(yesterday.schedule.some((p) => p.key === '2026-10-04|lu|0')).toBe(true);
    expect(plan([ev({})], at(10, 4, 10), yesterday.handled).catchUp).toEqual([]);
  });

  it('si la hora todavía no llegó, se programa en vez de avisar ya', () => {
    const p = plan([ev({})], at(10, 4, 8), [], { ...settings, notifyHour: 9 });
    expect(p.catchUp).toEqual([]);
    expect(p.schedule[0].date).toEqual(at(10, 4, 9));
    expect(p.schedule[0].key).toBe('2026-10-04|lu|0');
  });

  it('no avisa tarde los de días anteriores', () => {
    // El aviso de "en 7 días" era el 27/9: ya pasó y no es de hoy.
    expect(plan([ev({})], at(10, 4, 10)).catchUp.every((p) => p.key?.startsWith('2026-10-04'))).toBe(true);
  });

  it('programa el próximo año y los avisos previos', () => {
    const p = plan([ev({ day: 10 })], at(10, 4, 10));
    const keys = p.schedule.map((x) => x.key);
    expect(keys).toEqual(
      expect.arrayContaining(['2026-10-09|lu|1', '2026-10-10|lu|0', '2027-10-03|lu|7', '2027-10-10|lu|0']),
    );
    // El de "en 7 días" de este año (3/10) ya pasó.
    expect(keys).not.toContain('2026-10-03|lu|7');
  });

  it('olvida las claves de días que ya pasaron', () => {
    const p = plan([], at(10, 4, 10), ['2026-10-01|x|0', '2026-10-04|x|0', '2026-12-01|x|0']);
    expect(p.handled.sort()).toEqual(['2026-10-04|x|0', '2026-12-01|x|0']);
  });

  it('respeta el máximo de alarmas', () => {
    const many = Array.from({ length: 300 }, (_, i) => ev({ id: `e${i}`, day: (i % 28) + 1, month: (i % 12) + 1 }));
    expect(splitPlan(planAll(many, [], settings, at(10, 4, 10)), [], at(10, 4, 10), 400).schedule).toHaveLength(400);
  });
});
