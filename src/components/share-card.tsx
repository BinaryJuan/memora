import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

import { formatDayMonth } from '@/lib/dates';
import { firstName, initials } from '@/lib/events';
import { getKind } from '@/lib/kinds';
import type { MemoraEvent } from '@/lib/types';
import { Fonts, Space } from '@/theme/theme';
import { Icon } from './icon';
import { Button, Chip, ChipRow, Sheet, T } from './ui';

/** Misma piedrita que el ícono de la app, en una grilla de 120×120. */
const BLOB = 'M60 14c20 0 38 13 42 32s-6 40-24 50-42 8-56-6S8 52 18 34 40 14 60 14z';

const PALETTES = {
  terracota: { label: 'Terracota', bg: '#B56E4D', fg: '#FBF4EA', blob: '#C98A6B', accent: '#F2D4C2' },
  salvia: { label: 'Salvia', bg: '#7D8F6B', fg: '#F6F3EA', blob: '#94A684', accent: '#E1E8D3' },
  arena: { label: 'Arena', bg: '#E9DFCF', fg: '#3D3229', blob: '#DCCBB2', accent: '#B56E4D' },
} as const;
type PaletteId = keyof typeof PALETTES;

function heading(event: MemoraEvent): string {
  if (event.kind === 'birthday') return '¡Feliz cumple!';
  if (event.kind === 'anniversary') return '¡Feliz aniversario!';
  return '¡Hoy es el día!';
}

function Card({ event, years, palette }: { event: MemoraEvent; years: number | null; palette: PaletteId }) {
  const p = PALETTES[palette];
  const kind = getKind(event.kind);
  const name = event.kind === 'birthday' ? firstName(event.title) : event.title;
  return (
    <View style={[styles.card, { backgroundColor: p.bg }]}>
      <View style={styles.content}>
        <View style={styles.mark}>
          <Svg width={120} height={120} viewBox="0 0 120 120" style={StyleSheet.absoluteFill}>
            <Path d={BLOB} fill={p.blob} />
          </Svg>
          {event.icon || !kind.person ? (
            <Icon name={event.icon ?? kind.icon} size={52} color={p.fg} accent={p.accent} />
          ) : (
            <Text style={[styles.initials, { color: p.fg }]}>{initials(event.title)}</Text>
          )}
        </View>
        <Text style={[styles.heading, { color: p.fg }]}>{heading(event)}</Text>
        <Text style={[styles.name, { color: p.fg }]} numberOfLines={2}>
          {name}
        </Text>
        {years ? (
          <Text style={[styles.years, { color: p.fg }]}>
            {years} <Text style={styles.yearsLabel}>{years === 1 ? 'año' : 'años'}</Text>
          </Text>
        ) : null}
        <Text style={[styles.date, { color: p.fg }]}>{formatDayMonth(event.day, event.month)}</Text>
      </View>
      <Text style={[styles.brand, { color: p.fg }]}>memora</Text>
    </View>
  );
}

export function ShareCardSheet({
  event,
  years,
  visible,
  onClose,
}: {
  event: MemoraEvent;
  years: number | null;
  visible: boolean;
  onClose: () => void;
}) {
  const ref = useRef<View>(null);
  const [palette, setPalette] = useState<PaletteId>('terracota');
  const [busy, setBusy] = useState(false);

  const share = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Solo en el celular', 'Compartir la tarjeta funciona en la app de Android.');
      return;
    }
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1350 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Compartir tarjeta' });
    } catch {
      Alert.alert('Ups', 'No se pudo crear la imagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Tarjeta para compartir">
      <View ref={ref} collapsable={false} style={styles.capture}>
        <Card event={event} years={years} palette={palette} />
      </View>
      <ChipRow>
        {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
          <Chip key={id} label={PALETTES[id].label} color={PALETTES[id].bg} selected={palette === id} onPress={() => setPalette(id)} />
        ))}
      </ChipRow>
      <T variant="small" muted>
        Se comparte como imagen: mandásela por WhatsApp o subila a tus historias.
      </T>
      <Button label={busy ? 'Preparando…' : 'Compartir'} icon="share-2" disabled={busy} onPress={share} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  capture: { alignSelf: 'center', width: 288, aspectRatio: 4 / 5, borderRadius: 20, overflow: 'hidden' },
  card: { flex: 1, alignItems: 'center', paddingHorizontal: Space.xl, paddingTop: Space.xl, paddingBottom: Space.lg },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  mark: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: Space.sm },
  initials: { fontFamily: Fonts.display, fontSize: 36, letterSpacing: -1 },
  heading: { fontFamily: Fonts.medium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 },
  name: { fontFamily: Fonts.display, fontSize: 28, letterSpacing: -0.8, textAlign: 'center' },
  years: { fontFamily: Fonts.display, fontSize: 36, letterSpacing: -1 },
  yearsLabel: { fontFamily: Fonts.medium, fontSize: 16, letterSpacing: 0 },
  date: { fontFamily: Fonts.regular, fontSize: 14, opacity: 0.8 },
  brand: { fontFamily: Fonts.bold, fontSize: 11, letterSpacing: 2.5, opacity: 0.6 },
});
