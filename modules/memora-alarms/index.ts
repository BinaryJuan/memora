import { requireOptionalNativeModule } from 'expo';

/**
 * Módulo nativo propio (ver `android/`). En Expo Go y en la web no existe: ahí no se sabe.
 */
const native = requireOptionalNativeModule<{
  canScheduleExactAlarms(): boolean;
  isRingerSilent(): boolean;
}>('MemoraAlarms');

/** `true`/`false` si Android lo sabe; `null` si no se puede saber (Expo Go, web). */
export function canScheduleExactAlarms(): boolean | null {
  try {
    return native ? native.canScheduleExactAlarms() : null;
  } catch {
    return null;
  }
}

/** `true` si el teléfono está en silencio o en vibración; `null` si no se puede saber. */
export function isRingerSilent(): boolean | null {
  try {
    return native ? native.isRingerSilent() : null;
  } catch {
    return null;
  }
}
