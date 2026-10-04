import { getLocales } from 'expo-localization';

import { en } from './en';
import { es, type Strings } from './es';

export type { Strings };
export type Lang = 'es' | 'en';
export type LangPref = 'system' | Lang;

export const LANGS: Lang[] = ['es', 'en'];
/** Cada idioma escrito en su propio idioma, para el selector de Ajustes. */
export const LANG_NAMES: Record<Lang, string> = { es: 'Español', en: 'English' };

const DICTS: Record<Lang, Strings> = { es, en };

/** Idioma del teléfono: español si está en español; inglés para cualquier otro. */
export function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode;
    if (!code) return 'es';
    return code === 'es' ? 'es' : 'en';
  } catch {
    return 'es';
  }
}

export function resolveLang(pref: LangPref | undefined): Lang {
  return pref && pref !== 'system' ? pref : deviceLang();
}

/**
 * El idioma actual vive acá (no en un hook) porque también lo usan cosas que corren fuera de
 * las pantallas: los avisos, el widget y los formatos de fecha. Al cambiarlo, `_layout.tsx`
 * vuelve a montar la navegación para que todas las pantallas se redibujen.
 */
let current: Lang = deviceLang();

export function setLanguage(pref: LangPref | undefined) {
  current = resolveLang(pref);
}

export function getLang(): Lang {
  return current;
}

/** Los textos en el idioma actual. */
export function strings(): Strings {
  return DICTS[current];
}

export function stringsFor(lang: Lang): Strings {
  return DICTS[lang];
}
