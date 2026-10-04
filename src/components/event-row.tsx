import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/i18n/core';
import { formatDayMonth, isMilestone, shortCountdown } from '@/lib/dates';
import { initials, type Upcoming } from '@/lib/events';
import { getKind } from '@/lib/kinds';
import type { MemoraEvent, Tag } from '@/lib/types';
import { useStore } from '@/store/store';
import { Fonts, Radius, Space, tint, useTheme } from '@/theme/theme';
import { blobRadius, Icon, type IconKey } from './icon';
import { T } from './ui';

export function eventColor(e: Pick<MemoraEvent, 'tagIds'>, tags: Tag[], fallback: string): string {
  const tag = tags.find((t) => e.tagIds.includes(t.id));
  return tag?.color ?? fallback;
}

/** Ícono elegido; si no hay, iniciales para personas o el ícono del tipo de fecha. */
export function Avatar({
  event,
  size = 48,
  icon = event.icon,
  color: colorOverride,
}: {
  event: Pick<MemoraEvent, 'kind' | 'title' | 'tagIds' | 'icon'>;
  size?: number;
  icon?: IconKey;
  color?: string;
}) {
  const { c } = useTheme();
  const tags = useStore((s) => s.tags);
  const kind = getKind(event.kind);
  const color = colorOverride ?? eventColor(event, tags, c.accent);
  const showInitials = !icon && kind.person && event.title.trim() !== '';
  return (
    <View style={[{ width: size, height: size }, blobRadius(size), styles.avatar, { backgroundColor: tint(color, 0.2) }]}>
      {showInitials ? (
        <Text style={{ fontFamily: Fonts.display, fontSize: size * 0.36, color: c.text }}>{initials(event.title)}</Text>
      ) : (
        <Icon name={icon ?? kind.icon} size={size * 0.52} accent={color} />
      )}
    </View>
  );
}

export function EventRow({ item, showCountdown = true }: { item: Upcoming; showCountdown?: boolean }) {
  const { c } = useTheme();
  const { event, days, years } = item;
  const kind = getKind(event.kind);
  const milestone = isMilestone(years);
  const sub: string[] = [
    event.recurrence === 'monthly' ? strings().dates.everyMonth(event.day) : formatDayMonth(item.date.getDate(), item.date.getMonth() + 1),
  ];
  if (years && kind.yearsLabel) sub.push(kind.yearsLabel(years));
  else if (!kind.person || event.kind !== 'birthday') sub.push(kind.label);

  const soon = days <= 7;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Avatar event={event} />
      <View style={{ flex: 1, gap: 2 }}>
        <T variant="heading" numberOfLines={1}>
          {event.title}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <T variant="small" muted numberOfLines={1} style={{ flexShrink: 1 }}>
            {sub.join(' · ')}
          </T>
          {milestone ? <Icon name="sparkle" size={14} color={c.textMuted} accent={c.accent} /> : null}
        </View>
      </View>
      {showCountdown ? (
        <View
          style={[
            styles.pill,
            { backgroundColor: days === 0 ? c.accent : soon ? c.accentSoft : c.surfaceAlt },
          ]}>
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 12,
              color: days === 0 ? c.onAccent : soon ? c.accent : c.textMuted,
            }}>
            {shortCountdown(days)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.md, paddingVertical: Space.sm + 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
});
