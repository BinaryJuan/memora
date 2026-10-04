import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { eventColor, EventRow } from '@/components/event-row';
import { Card, EmptyState, Fab, IconButton, PageTitle, Screen, Section, tap } from '@/components/ui';
import {
  capitalize,
  daysBetween,
  daysInMonth,
  formatLongDate,
  MONTHS,
  occurrenceInMonth,
  sameDay,
  WEEKDAY_INITIALS,
  yearsAt,
} from '@/lib/dates';
import type { Upcoming } from '@/lib/events';
import { useStore } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';

export default function CalendarScreen() {
  const { c } = useTheme();
  const events = useStore((s) => s.events);
  const tags = useStore((s) => s.tags);
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });
  const [selected, setSelected] = useState<number>(today.getDate());

  // Ocurrencias del mes, agrupadas por día.
  const byDay = useMemo(() => {
    const map = new Map<number, Upcoming[]>();
    for (const e of events) {
      const occ = occurrenceInMonth(e, cursor.y, cursor.m);
      if (!occ) continue;
      const d = occ.getDate();
      const item: Upcoming = { event: e, date: occ, days: daysBetween(today, occ), years: yearsAt(e, occ) };
      map.set(d, [...(map.get(d) ?? []), item]);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, cursor]);

  const total = daysInMonth(cursor.y, cursor.m);
  const firstWeekday = (new Date(cursor.y, cursor.m - 1, 1).getDay() + 6) % 7; // lunes = 0
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const move = (delta: number) => {
    tap();
    let m = cursor.m + delta;
    let y = cursor.y;
    if (m < 1) {
      m = 12;
      y--;
    } else if (m > 12) {
      m = 1;
      y++;
    }
    setCursor({ y, m });
    setSelected(y === today.getFullYear() && m === today.getMonth() + 1 ? today.getDate() : 1);
  };

  const selectedDate = new Date(cursor.y, cursor.m - 1, Math.min(selected, total));
  const dayItems = byDay.get(selected) ?? [];
  const monthCount = [...byDay.values()].reduce((n, l) => n + l.length, 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageTitle
          kicker={monthCount === 0 ? 'Sin fechas este mes' : monthCount === 1 ? '1 fecha este mes' : `${monthCount} fechas este mes`}
          title={`${capitalize(MONTHS[cursor.m - 1])} ${cursor.y !== today.getFullYear() ? cursor.y : ''}`.trim()}
          right={
            <View style={{ flexDirection: 'row', gap: Space.xs }}>
              <IconButton icon="chevron-left" filled onPress={() => move(-1)} label="Mes anterior" />
              <IconButton icon="chevron-right" filled onPress={() => move(1)} label="Mes siguiente" />
            </View>
          }
        />

        <Card style={{ paddingHorizontal: Space.sm }}>
          <View style={styles.week}>
            {WEEKDAY_INITIALS.map((d, i) => (
              <Text key={i} style={[styles.weekday, { color: c.textMuted, fontFamily: Fonts.medium }]}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={i} style={styles.cell} />;
              const items = byDay.get(day) ?? [];
              const isToday = sameDay(new Date(cursor.y, cursor.m - 1, day), today);
              const isSelected = day === selected;
              return (
                <Pressable
                  key={i}
                  style={styles.cell}
                  onPress={() => setSelected(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${day} de ${MONTHS[cursor.m - 1]}${items.length ? `, ${items.length} ${items.length === 1 ? 'fecha' : 'fechas'}` : ''}`}>
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && { backgroundColor: c.accent },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: c.accent },
                    ]}>
                    <Text
                      style={{
                        fontFamily: isSelected || isToday ? Fonts.bold : Fonts.regular,
                        fontSize: 15,
                        color: isSelected ? c.onAccent : c.text,
                      }}>
                      {day}
                    </Text>
                  </View>
                  <View style={styles.dots}>
                    {items.slice(0, 3).map((u) => (
                      <View key={u.event.id} style={[styles.dot, { backgroundColor: eventColor(u.event, tags, c.accent) }]} />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Section title={formatLongDate(selectedDate)}>
          {dayItems.length === 0 ? (
            <EmptyState icon="calendar" title="Día libre" text="No hay nada anotado para este día." />
          ) : (
            dayItems.map((u) => <EventRow key={u.event.id} item={u} showCountdown={u.days >= 0} />)
          )}
        </Section>
      </Screen>
      <Fab onPress={() => router.push({ pathname: '/event/new', params: { day: selected, month: cursor.m } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', marginBottom: Space.xs },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, height: 52 },
  dayCircle: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 3, height: 6, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
