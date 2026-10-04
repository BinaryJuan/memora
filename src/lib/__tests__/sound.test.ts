import { describe, expect, it, jest } from '@jest/globals';

import { birthdaysToday, chimePlan } from '../sound';
import type { MemoraEvent } from '../types';

// El reproductor y el módulo nativo no hacen falta para probar la regla.
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));
jest.mock('../../../assets/sounds/cumple.mp3', () => 1);

const ev = (id: string, partial: Partial<MemoraEvent> = {}): MemoraEvent => ({
  id,
  title: id,
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

const DAY = '2026-10-04';

describe('sonido de cumpleaños', () => {
  it('solo cuenta los cumpleaños de hoy', () => {
    const now = new Date(2026, 9, 4, 10);
    const events = [
      ev('ana'),
      ev('aniv', { kind: 'anniversary' }),
      ev('mañana', { day: 5 }),
    ];
    expect(birthdaysToday(events, now)).toEqual(['ana']);
  });

  it('suena la primera vez que se entra', () => {
    expect(chimePlan(['ana'], null, DAY)).toEqual({
      play: true,
      heard: { date: DAY, ids: ['ana'] },
    });
  });

  it('no vuelve a sonar al entrar de nuevo el mismo día', () => {
    const first = chimePlan(['ana'], null, DAY);
    expect(chimePlan(['ana'], first.heard, DAY).play).toBe(false);
  });

  it('vuelve a sonar si aparece otro cumpleaños ese día', () => {
    const first = chimePlan(['ana'], null, DAY);
    const second = chimePlan(['ana', 'juan'], first.heard, DAY);
    expect(second).toEqual({
      play: true,
      heard: { date: DAY, ids: ['ana', 'juan'] },
    });
    expect(chimePlan(['ana', 'juan'], second.heard, DAY).play).toBe(false);
  });

  it('al otro día empieza de cero', () => {
    const lastYear = chimePlan(['ana'], null, '2025-10-04');
    expect(chimePlan(['ana'], lastYear.heard, DAY).play).toBe(true);
  });

  it('sin cumpleaños hoy no suena', () => {
    expect(chimePlan([], null, DAY).play).toBe(false);
  });
});
