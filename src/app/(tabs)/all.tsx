import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { EventRow } from '@/components/event-row';
import { Chip, ChipRow, EmptyState, Fab, Field, PageTitle, Screen, Section, Segmented } from '@/components/ui';
import { clampDate, daysBetween } from '@/lib/dates';
import { upcomingOf, type Upcoming } from '@/lib/events';
import { KINDS } from '@/lib/kinds';
import type { KindId } from '@/lib/types';
import { useStore } from '@/store/store';
import { Space } from '@/theme/theme';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function AllScreen() {
  const events = useStore((s) => s.events);
  const tags = useStore((s) => s.tags);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [kind, setKind] = useState<KindId | null>(null);
  const [sort, setSort] = useState<'date' | 'name'>('date');

  const { active, past } = useMemo(() => {
    const q = normalize(query.trim());
    const now = new Date();
    const filtered = events.filter(
      (e) =>
        (!q || normalize(`${e.title} ${e.notes ?? ''}`).includes(q)) &&
        (!tag || e.tagIds.includes(tag)) &&
        (!kind || e.kind === kind),
    );
    const active: Upcoming[] = [];
    const past: Upcoming[] = [];
    for (const e of filtered) {
      const u = upcomingOf(e, now);
      if (u) active.push(u);
      else {
        // Recordatorios de una sola vez que ya pasaron.
        const date = clampDate(e.year ?? now.getFullYear(), e.month, e.day);
        past.push({ event: e, date, days: daysBetween(now, date), years: null });
      }
    }
    const cmp =
      sort === 'name'
        ? (a: Upcoming, b: Upcoming) => a.event.title.localeCompare(b.event.title)
        : (a: Upcoming, b: Upcoming) => a.days - b.days;
    return { active: active.sort(cmp), past: past.sort((a, b) => b.date.getTime() - a.date.getTime()) };
  }, [events, query, tag, kind, sort]);

  const usedKinds = KINDS.filter((k) => events.some((e) => e.kind === k.id));

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageTitle kicker={`${events.length} ${events.length === 1 ? 'fecha' : 'fechas'}`} title="Todas" />
        <View style={{ gap: Space.md }}>
          <Field
            placeholder="Buscar por nombre o nota…"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <ChipRow scroll>
            {usedKinds.length > 1
              ? usedKinds.map((k) => (
                  <Chip
                    key={k.id}
                    label={k.label}
                    icon={k.icon}
                    selected={kind === k.id}
                    onPress={() => setKind(kind === k.id ? null : k.id)}
                  />
                ))
              : null}
            {tags.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                icon={t.icon}
                color={t.color}
                selected={tag === t.id}
                onPress={() => setTag(tag === t.id ? null : t.id)}
              />
            ))}
          </ChipRow>
          <Segmented
            options={[
              { id: 'date', label: 'Por fecha' },
              { id: 'name', label: 'A – Z' },
            ]}
            value={sort}
            onChange={setSort}
          />
        </View>

        {events.length === 0 ? (
          <EmptyState icon="envelope" title="Sin fechas" text="Tocá «Agregar» para anotar la primera." />
        ) : active.length + past.length === 0 ? (
          <EmptyState icon="search" title="Sin resultados" text="Probá con otra búsqueda o quitá algún filtro." />
        ) : null}

        {active.length > 0 ? (
          <Section title="Próximas">
            {active.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
        {past.length > 0 ? (
          <Section title="Ya pasaron">
            {past.map((u) => (
              <EventRow key={u.event.id} item={u} showCountdown={false} />
            ))}
          </Section>
        ) : null}
      </Screen>
      <Fab onPress={() => router.push('/event/new')} />
    </View>
  );
}
