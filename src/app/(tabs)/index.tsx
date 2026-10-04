import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Confetti } from '@/components/confetti';
import { Icon } from '@/components/icon';
import { Avatar, EventRow } from '@/components/event-row';
import { Button, Card, Chip, ChipRow, EmptyState, Fab, IconButton, PageTitle, Screen, Section, T, tap } from '@/components/ui';
import { strings } from '@/i18n/core';
import { dateKey, formatLongDate } from '@/lib/dates';
import { upcomingList, type Upcoming } from '@/lib/events';
import { getKind } from '@/lib/kinds';
import { useStore } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';

function greeting(d: Date): string {
  const g = strings().home.greeting;
  const h = d.getHours();
  if (h < 6) return g.night;
  if (h < 13) return g.morning;
  if (h < 20) return g.afternoon;
  return g.night;
}

function TodayCard({ items }: { items: Upcoming[] }) {
  const { c } = useTheme();
  const toggleGreeted = useStore((s) => s.toggleGreeted);
  const key = dateKey(new Date());
  return (
    <Card style={{ backgroundColor: c.accentSoft, borderColor: 'transparent', gap: Space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
        <Icon name="party" size={26} />
        <T variant="title">{strings().home.todayTitle}</T>
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
                  {greeted ? strings().home.greeted : strings().home.greet}
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
  const s = strings().home;

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
        <PageTitle kicker={greeting(now)} title="memora" />
        <EmptyState icon="balloon" title={s.emptyTitle} text={s.emptyText}>
          <Button label={s.addFirst} icon="plus" onPress={() => router.push('/event/new')} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageTitle
          kicker={formatLongDate(now)}
          title={greeting(now)}
          right={<IconButton icon="list" filled label={s.allDates} onPress={() => router.push('/all')} />}
        />

        {tags.length > 0 ? (
          <ChipRow scroll>
            <Chip label={s.allChip} selected={filter === null} onPress={() => setFilter(null)} />
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
          <EmptyState icon="search" title={s.noneForTag} text={s.noneForTagText} />
        ) : null}

        {week.length > 0 ? (
          <Section title={s.thisWeek}>
            {week.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
        {month.length > 0 ? (
          <Section title={s.thisMonth}>
            {month.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}
        {later.length > 0 ? (
          <Section title={s.later}>
            {later.map((u) => (
              <EventRow key={u.event.id} item={u} />
            ))}
          </Section>
        ) : null}

        <Button
          label={s.seeAll(events.length)}
          icon="list"
          variant="ghost"
          onPress={() => router.push('/all')}
          style={{ marginTop: Space.xl }}
        />
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
