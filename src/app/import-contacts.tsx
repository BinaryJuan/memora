import Feather from '@expo/vector-icons/Feather';
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Divider, EmptyState, Header, Screen, T, tap } from '@/components/ui';
import { formatDayMonth, isValidDate } from '@/lib/dates';
import type { KindId } from '@/lib/types';
import { isValidPhone, LIMITS } from '@/lib/validation';
import { useStore, type NewEvent } from '@/store/store';
import { Fonts, Space, useTheme } from '@/theme/theme';

interface Candidate {
  key: string;
  title: string;
  kind: KindId;
  day: number;
  month: number;
  year?: number;
  phone?: string;
  exists: boolean;
}

type Status = 'loading' | 'denied' | 'ready' | 'unsupported';

export default function ImportContactsScreen() {
  const { c } = useTheme();
  const addEvents = useStore((s) => s.addEvents);
  const [status, setStatus] = useState<Status>(Platform.OS === 'web' ? 'unsupported' : 'loading');
  const [items, setItems] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const perm = await requestPermissionsAsync();
      if (perm.status !== 'granted') return setStatus('denied');
      const contacts = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES, ContactField.DATES]);
      const { events: current } = useStore.getState();
      const found: Candidate[] = [];
      contacts.forEach((ct, i) => {
        const name = ct.fullName?.trim().slice(0, LIMITS.title);
        if (!name) return;
        for (const d of ct.dates ?? []) {
          const label = (d.label ?? '').toLowerCase();
          const kind: KindId | null = label.includes('birth') || label.includes('cumple')
            ? 'birthday'
            : label.includes('anniv') || label.includes('aniver')
              ? 'anniversary'
              : null;
          const date = d.date;
          if (!kind || !date || !isValidDate(date.day, date.month)) continue;
          const exists = current.some(
            (e) => e.kind === kind && e.day === date.day && e.month === date.month && e.title.toLowerCase() === name.toLowerCase(),
          );
          found.push({
            key: `${i}-${kind}`,
            title: name,
            kind,
            day: date.day,
            month: date.month,
            year: date.year && date.year > 1900 ? date.year : undefined,
            phone: ct.phones?.map((ph) => ph.number?.trim()).find((n): n is string => !!n && isValidPhone(n)),
            exists,
          });
        }
      });
      found.sort((a, b) => a.title.localeCompare(b.title));
      setItems(found);
      setSelected(new Set(found.filter((f) => !f.exists).map((f) => f.key)));
      setStatus('ready');
    })().catch(() => {
      Alert.alert('Ups', 'No se pudieron leer los contactos.');
      setStatus('denied');
    });
  }, []);

  const toggle = (key: string) => {
    tap();
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const doImport = () => {
    const chosen = items.filter((i) => selected.has(i.key));
    const list: NewEvent[] = chosen.map((i) => ({
      title: i.title,
      kind: i.kind,
      day: i.day,
      month: i.month,
      year: i.year,
      recurrence: 'yearly',
      tagIds: [],
      phone: i.phone,
    }));
    addEvents(list);
    Alert.alert('¡Listo!', `Se importaron ${list.length} ${list.length === 1 ? 'fecha' : 'fechas'}.`);
    router.back();
  };

  return (
    <Screen footer={status === 'ready' && items.length > 0 ? (
      <View style={[styles.footer, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Button
          label={selected.size === 0 ? 'Elegí al menos una' : `Importar ${selected.size}`}
          icon="download"
          disabled={selected.size === 0}
          onPress={doImport}
        />
      </View>
    ) : undefined}>
      <Header title="Importar contactos" />
      {status === 'loading' ? (
        <View style={{ paddingVertical: Space.xxl, alignItems: 'center', gap: Space.md }}>
          <ActivityIndicator color={c.accent} />
          <T muted>Buscando cumpleaños en tus contactos…</T>
        </View>
      ) : null}
      {status === 'unsupported' ? (
        <EmptyState icon="phone" title="Solo en el celular" text="Importar contactos funciona en la app de Android." />
      ) : null}
      {status === 'denied' ? (
        <EmptyState icon="lock" title="Sin permiso" text="Para importar, permití que Memora lea tus contactos desde los ajustes del teléfono." />
      ) : null}
      {status === 'ready' && items.length === 0 ? (
        <EmptyState icon="question" title="No encontramos fechas" text="Ninguno de tus contactos tiene cumpleaños o aniversario guardado." />
      ) : null}
      {status === 'ready' && items.length > 0 ? (
        <>
          <T muted style={{ marginBottom: Space.lg }}>
            Encontramos {items.length} {items.length === 1 ? 'fecha' : 'fechas'}. Elegí cuáles sumar.
          </T>
          <Card style={{ paddingVertical: Space.xs }}>
            {items.map((i, idx) => {
              const on = selected.has(i.key);
              return (
                <View key={i.key}>
                  {idx > 0 ? <Divider /> : null}
                  <Pressable onPress={() => toggle(i.key)} style={styles.row}>
                    <Feather name={on ? 'check-square' : 'square'} size={20} color={on ? c.accent : c.textMuted} />
                    <View style={{ flex: 1 }}>
                      <T style={{ fontFamily: Fonts.medium }}>{i.title}</T>
                      <T variant="small" muted>
                        {i.kind === 'birthday' ? 'Cumpleaños' : 'Aniversario'} · {formatDayMonth(i.day, i.month)}
                        {i.year ? ` de ${i.year}` : ''}
                        {i.exists ? ' · ya la tenés' : ''}
                      </T>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.md },
  footer: { padding: Space.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
