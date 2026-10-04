import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Platform } from 'react-native';

import { isRingerSilent } from '../../modules/memora-alarms';
import { dateKey } from './dates';
import { upcomingOf } from './events';
import type { MemoraEvent } from './types';

/** El sonido en sí. Para cambiarlo, reemplazar el archivo (ver scripts/generar-sonido.js). */
const CHIME = require('../../assets/sounds/cumple.wav');
/** Último día en que sonó, para que sea una vez por día y no cada vez que se abre la app. */
const LAST_KEY = 'memora-sonido-cumple';
const VOLUME = 0.7;

export function hasBirthdayToday(events: MemoraEvent[], now = new Date()): boolean {
  return events.some((e) => e.kind === 'birthday' && upcomingOf(e, now)?.days === 0);
}

let playing = false;

/**
 * Al abrir la app un día de cumpleaños, un sonidito corto. Una sola vez por día, nunca con el
 * teléfono en silencio o vibración, y sin cortar la música que esté sonando.
 */
export async function chimeIfBirthday(events: MemoraEvent[], enabled: boolean): Promise<void> {
  if (!enabled || playing || Platform.OS === 'web' || !hasBirthdayToday(events)) return;
  if (isRingerSilent()) return;
  const today = dateKey(new Date());
  try {
    if ((await AsyncStorage.getItem(LAST_KEY)) === today) return;
    await AsyncStorage.setItem(LAST_KEY, today);
    playing = true;
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });
    const player = createAudioPlayer(CHIME);
    player.volume = VOLUME;
    player.play();
    setTimeout(() => {
      player.remove();
      playing = false;
    }, 3000);
  } catch {
    playing = false;
  }
}
