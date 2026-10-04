import Feather from '@expo/vector-icons/Feather';
import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Divider, EmptyState, Header, Screen, T, tap } from '@/components/ui';
import { strings } from '@/i18n/core';
import { formatDayMonth, isValidDate } from '@/lib/dates';
import { getKind } from '@/lib/kinds';
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
  const s = strings().contacts;

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
      found.sort((a, b) => a.title.localeCompare(b.title, strings().locale));
      setItems(found);
      setSelected(new Set(found.filter((f) => !f.exists).map((f) => f.key)));
      setStatus('ready');
    })().catch(() => {
      Alert.alert(strings().common.oops, strings().contacts.readFailed);
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
    Alert.alert(s.done, s.doneText(list.length));
    router.back();
  };

  return (
    <Screen footer={status === 'ready' && items.length > 0 ? (
      <View style={[styles.footer, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Button
          label={selected.size === 0 ? s.pickOne : s.importN(selected.size)}
          icon="download"
          disabled={selected.size === 0}
          onPress={doImport}
        />
      </View>
    ) : undefined}>
      <Header title={s.title} />
      {status === 'loading' ? (
        <View style={{ paddingVertical: Space.xxl, alignItems: 'center', gap: Space.md }}>
          <ActivityIndicator color={c.accent} />
          <T muted>{s.searching}</T>
        </View>
      ) : null}
      {status === 'unsupported' ? (
        <EmptyState icon="phone" title={strings().common.onlyOnPhone} text={s.onlyPhoneText} />
      ) : null}
      {status === 'denied' ? (
        <EmptyState icon="lock" title={s.noPermission} text={s.noPermissionText} />
      ) : null}
      {status === 'ready' && items.length === 0 ? (
        <EmptyState icon="question" title={s.noneFound} text={s.noneFoundText} />
      ) : null}
      {status === 'ready' && items.length > 0 ? (
        <>
          <T muted style={{ marginBottom: Space.lg }}>
            {s.found(items.length)}
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
                        {getKind(i.kind).label} · {formatDayMonth(i.day, i.month)}
                        {i.year ? s.ofYear(i.year) : ''}
                        {i.exists ? s.already : ''}
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
