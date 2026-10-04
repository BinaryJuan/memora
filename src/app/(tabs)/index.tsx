import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Confetti } from '@/components/confetti';
import { Icon } from '@/components/icon';
import { Avatar, EventRow } from '@/components/event-row';
import { Card, Chip, ChipRow, EmptyState, Fab, PageTitle, Screen, Section, T, Button, tap } from '@/components/ui';
import { dateKey, formatLongDate } from '@/lib/dates';
import { upcomingList, type Upcoming } from '@/lib/events';
import { getKind } from '@/lib/kinds';
import { useStore } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';

function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

function TodayCard({ items }: { items: Upcoming[] }) {
  const { c } = useTheme();
  const toggleGreeted = useStore((s) => s.toggleGreeted);
  const key = dateKey(new Date());
  return (
    <Card style={{ backgroundColor: c.accentSoft, borderColor: 'transparent', gap: Space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
        <Icon name="party" size={26} />
        <T variant="title">Hoy es un día especial</T>
      </View>
      {items.map(({ event, years }) => {
        const kind = getKind(event.kind);
        const greeted = event.greetedOn.includes(key);
        return (
          <Pressable
            key={event.id}
            onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
            style={styles.todayRow}>
            <Avatar event={event} size={44} />
            <View style={{ flex: 1 }}>
              <T variant="heading" numberOfLines={1}>
                {event.title}
              </T>
              <T variant="small" muted>
                {years && kind.yearsLabel ? kind.yearsLabel(years) : kind.label}
              </T>
            </View>
            {kind.person ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: greeted }}
                onPress={() => {
                  tap();
                  toggleGreeted(event.id, key);
                }}
                style={[
                  styles.greetBtn,
                  { backgroundColor: greeted ? c.success : c.surface, borderColor: greeted ? c.success : c.border },
                ]}>
                <Feather name={greeted ? 'check' : 'message-circle'} size={14} color={greeted ? '#fff' : c.text} />
                <T variant="small" style={{ fontFamily: Fonts.bold }} color={greeted ? '#fff' : c.text}>
                  {greeted ? 'Saludado' : 'Saludar'}
                </T>
              </Pressable>
            ) : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

export default function HomeScreen() {
  const events = useStore((s) => s.events);
  const tags = useStore((s) => s.tags);
  const [filter, setFilter] = useState<string | null>(null);
  const now = new Date();

  const list = useMemo(() => {
    const filtered = filter ? events.filter((e) => e.tagIds.includes(filter)) : events;
    return upcomingList(filtered);
  }, [events, filter]);

  const today = list.filter((u) => u.days === 0);
  const week = list.filter((u) => u.days > 0 && u.days <= 7);
  const month = list.filter((u) => u.days > 7 && u.days <= 31);
  const later = list.filter((u) => u.days > 31);

  if (events.length === 0) {
    return (
      <Screen>
        <PageTitle kicker={greeting(now)} title="Memora" />
        <EmptyState
          icon="balloon"
          title="Todavía no anotaste nada"
          text="Cumpleaños, aniversarios o cualquier fecha que no te quieras olvidar. Empezá por la primera.">
          <Button label="Agregar una fecha" icon="plus" onPress={() => router.push('/event/new')} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageTitle kicker={formatLongDate(now)} title={greeting(now)} />

        {tags.length > 0 ? (
          <ChipRow scroll>
            <Chip label="Todas" selected={filter === null} onPress={() => setFilter(null)} />
            {tags.map((t) => (
              <Chip
                key={t.id}
                label={t.name}
                icon={t.icon}
                color={t.color}
                selected={filter === t.id}
                onPress={() => setFilter(filter === t.id ? null : t.id)}
              />
            ))}
          </ChipRow>
        ) : null}

        {today.length > 0 ? (
          <View style={{ marginTop: Space.lg }}>
            <TodayCard items={today} />
          </View>
        ) : null}

        {list.length === 0 ? (
          <EmptyState icon="search" title="Nada por acá" text="No hay fechas próximas con esta etiqueta." />
        ) : null}

        {week.length > 0 ? (
          <Section title="Esta semana">
            {week.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
        {month.length > 0 ? (
          <Section title="Este mes">
            {month.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
        {later.length > 0 ? (
          <Section title="Más adelante">
            {later.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
      </Screen>
      <Fab onPress={() => router.push('/event/new')} />
      {today.length > 0 ? <Confetti /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  greetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
