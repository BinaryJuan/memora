import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { isRingerSilent } from '../../modules/memora-alarms';
import { dateKey } from './dates';
import { upcomingOf } from './events';
import type { MemoraEvent } from './types';

/** El sonido en sí (tres notas que suben). Para cambiarlo, reemplazar el archivo. */
const CHIME = require('../../assets/sounds/cumple.mp3');
/** Qué cumpleaños ya sonaron hoy: { date: 'AAAA-MM-DD', ids: [...] }. */
const HEARD_KEY = 'memora-sonido-cumple';
const VOLUME = 0.7;

export interface Heard {
  date: string;
  ids: string[];
}

/** Los cumpleaños que son hoy. */
export function birthdaysToday(events: MemoraEvent[], now = new Date()): string[] {
  return events.filter((e) => e.kind === 'birthday' && upcomingOf(e, now)?.days === 0).map((e) => e.id);
}

/**
 * Suena solo si hoy hay algún cumpleaños que todavía no sonó: al volver a entrar no se repite,
 * salvo que aparezca otro (por ejemplo, porque se cargó una fecha nueva). Al otro día se empieza de cero.
 */
export function chimePlan(today: string[], heard: Heard | null, date: string): { play: boolean; heard: Heard } {
  const before = heard?.date === date ? heard.ids : [];
  const fresh = today.filter((id) => !before.includes(id));
  return { play: fresh.length > 0, heard: { date, ids: [...before, ...fresh] } };
}

async function loadHeard(): Promise<Heard | null> {
  try {
    const raw = await AsyncStorage.getItem(HEARD_KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    if (typeof v !== 'object' || v === null) return null;
    const { date, ids } = v as Partial<Heard>;
    return typeof date === 'string' && Array.isArray(ids) ? { date, ids: ids.filter((x) => typeof x === 'string') } : null;
  } catch {
    return null;
  }
}

let busy = false;

/**
 * Al entrar a la app un día de cumpleaños, un sonidito corto. Nunca con el teléfono en
 * silencio o vibración, y sin cortar la música que esté sonando.
 */
export async function chimeIfBirthday(events: MemoraEvent[], enabled: boolean): Promise<void> {
  if (!enabled || busy || Platform.OS === 'web') return;
  const today = birthdaysToday(events);
  if (today.length === 0) return;
  busy = true;
  try {
    const plan = chimePlan(today, await loadHeard(), dateKey(new Date()));
    if (!plan.play) return;
    // En silencio no suena ni se marca como escuchado: va a sonar al volver a entrar con sonido.
    if (isRingerSilent()) return;
    await AsyncStorage.setItem(HEARD_KEY, JSON.stringify(plan.heard));
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
    const player = createAudioPlayer(CHIME);
    player.volume = VOLUME;
    player.play();
    setTimeout(() => player.remove(), 4000);
  } catch {
    // Si el sonido falla, la app sigue como si nada.
  } finally {
    busy = false;
  }
}
