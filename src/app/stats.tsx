import { StyleSheet, Text, View } from 'react-native';

import { Card, EmptyState, Header, Screen, Section, T } from '@/components/ui';
import { capitalize, MONTHS } from '@/lib/dates';
import { upcomingList } from '@/lib/events';
import { KINDS } from '@/lib/kinds';
import { useStore } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const { c } = useTheme();
  return (
    <View style={styles.barRow}>
      <T variant="small" style={{ width: 92 }} numberOfLines={1}>
        {label}
      </T>
      <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${max ? (value / max) * 100 : 0}%` }]} />
      </View>
      <T variant="small" muted style={{ width: 24, textAlign: 'right' }}>
        {value}
      </T>
    </View>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  const { c } = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontFamily: Fonts.display, fontSize: 28, color: c.text }}>{value}</Text>
      <T variant="small" muted style={{ textAlign: 'center' }}>
        {label}
      </T>
    </Card>
  );
}

export default function StatsScreen() {
  const { c } = useTheme();
  const events = useStore((s) => s.events);
  const tags = useStore((s) => s.tags);

  if (events.length === 0) {
    return (
      <Screen>
        <Header title="Estadísticas" />
        <EmptyState icon="chart" title="Todavía no hay datos" text="Agregá algunas fechas y volvé." />
      </Screen>
    );
  }

  const yearly = events.filter((e) => e.recurrence !== 'monthly');
  const byMonth = MONTHS.map((_, i) => yearly.filter((e) => e.month === i + 1).length);
  const maxMonth = Math.max(...byMonth);
  const topMonth = byMonth.indexOf(maxMonth);
  const byKind = KINDS.map((k) => ({ k, n: events.filter((e) => e.kind === k.id).length })).filter((x) => x.n > 0);
  const byTag = tags.map((t) => ({ t, n: events.filter((e) => e.tagIds.includes(t.id)).length }));
  const nextRound = upcomingList(events).find((u) => u.years !== null && u.years % 10 === 0);
  const gifts = events.reduce((n, e) => n + e.giftsGiven.length, 0);
  const memories = events.reduce((n, e) => n + e.memories.length, 0);

  return (
    <Screen>
      <Header title="Estadísticas" />
      <View style={{ flexDirection: 'row', gap: Space.sm }}>
        <Stat value={events.length} label="fechas" />
        <Stat value={gifts} label="regalos hechos" />
        <Stat value={memories} label="recuerdos" />
      </View>

      {maxMonth > 0 ? (
        <Section title="Por mes">
          <Card style={{ gap: Space.sm }}>
            <T>
              El mes con más fechas es <T style={{ fontFamily: Fonts.bold }}>{MONTHS[topMonth]}</T> ({maxMonth}).
            </T>
            {byMonth.map((n, i) => (
              <Bar key={i} label={capitalize(MONTHS[i])} value={n} max={maxMonth} color={i === topMonth ? c.accent : c.textMuted} />
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title="Por tipo">
        <Card style={{ gap: Space.sm }}>
          {byKind.map(({ k, n }) => (
            <Bar key={k.id} label={k.label} value={n} max={events.length} color={c.accent} />
          ))}
        </Card>
      </Section>

      {byTag.length > 0 ? (
        <Section title="Por etiqueta">
          <Card style={{ gap: Space.sm }}>
            {byTag.map(({ t, n }) => (
              <Bar key={t.id} label={t.name} value={n} max={events.length} color={t.color} />
            ))}
          </Card>
        </Section>
      ) : null}

      {nextRound ? (
        <Section title="Próximo número redondo">
          <Card>
            <T>
              <T style={{ fontFamily: Fonts.bold }}>{nextRound.event.title}</T>: {nextRound.years} años, en {nextRound.days}{' '}
              {nextRound.days === 1 ? 'día' : 'días'}.
            </T>
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  track: { flex: 1, height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
