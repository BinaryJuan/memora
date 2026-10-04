import { useColorScheme } from 'react-native';

import { useStore } from '@/store/store';

/**
 * Paleta "café de Palermo": arena tostada, terracota, salvia y mostaza.
 * Todo mate y de baja saturación; sin blancos puros ni negros puros.
 */
const light = {
  bg: '#E9DFCF', // arena
  surface: '#F3EBDF', // lino claro
  surfaceAlt: '#DFD2BF', // avena tostada
  text: '#3D3229', // café
  textMuted: '#857767', // tierra
  border: '#D8CAB5',
  accent: '#B56E4D', // terracota
  accentSoft: '#E8CDBA', // durazno tostado
  onAccent: '#FBF4EA',
  success: '#6F825E', // salvia
  successSoft: '#D6DBC6',
  danger: '#A85B4F',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#1F1B17', // espresso
  surface: '#282320',
  surfaceAlt: '#332D28',
  text: '#F0E8DC',
  textMuted: '#A99D8F',
  border: '#3A332D',
  accent: '#D49A7E',
  accentSoft: '#3D2E26',
  onAccent: '#241E19',
  success: '#A3B391',
  successSoft: '#2C3326',
  danger: '#D48A7F',
};

export const Fonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  bold: 'PlusJakartaSans_700Bold',
};

export const Radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export function useTheme(): { c: Palette; dark: boolean } {
  const system = useColorScheme();
  const mode = useStore((s) => s.settings.theme);
  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark');
  return { c: isDark ? dark : light, dark: isDark };
}

/** Color con transparencia, para fondos suaves de etiquetas. */
export function tint(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
