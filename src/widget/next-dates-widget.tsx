import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { strings } from '@/i18n/core';
import { formatDayMonth, shortCountdown } from '@/lib/dates';
import type { Upcoming } from '@/lib/events';

// El widget no lee el tema de la app: va siempre en la paleta clara (arena).
const C = {
  bg: '#E9DFCF',
  row: '#F3EBDF',
  text: '#3D3229',
  muted: '#857767',
  accent: '#B56E4D',
  accentSoft: '#E8CDBA',
  onAccent: '#FBF4EA',
} as const;

const BOLD = 'PlusJakartaSans_700Bold';
const MEDIUM = 'PlusJakartaSans_500Medium';

function Row({ item }: { item: Upcoming }) {
  const today = item.days === 0;
  const soon = item.days <= 7;
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `memora://event/${item.event.id}` }}
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.row,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexGap: 10,
      }}>
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget text={item.event.title} maxLines={1} truncate="END" style={{ fontSize: 14, fontFamily: BOLD, color: C.text }} />
        <TextWidget
          text={formatDayMonth(item.date.getDate(), item.date.getMonth() + 1)}
          maxLines={1}
          style={{ fontSize: 12, fontFamily: MEDIUM, color: C.muted }}
        />
      </FlexWidget>
      <FlexWidget
        style={{
          backgroundColor: today ? C.accent : soon ? C.accentSoft : C.bg,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}>
        <TextWidget
          text={shortCountdown(item.days)}
          style={{ fontSize: 12, fontFamily: BOLD, color: today ? C.onAccent : C.accent }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Widget "Próximas fechas": las que vienen, con cuánto falta. */
export function NextDatesWidget({ items, rows, fallback }: { items: Upcoming[]; rows: number; fallback?: boolean }) {
  const w = strings().widget;
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        backgroundColor: C.bg,
        borderRadius: 22,
        padding: 14,
        flexDirection: 'column',
        flexGap: 6,
      }}>
      <TextWidget text={w.heading} style={{ fontSize: 11, fontFamily: BOLD, color: C.muted, letterSpacing: 0.08 }} />
      {items.length === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget
            text={fallback ? w.fallbackTitle : w.emptyTitle}
            style={{ fontSize: 15, fontFamily: BOLD, color: C.text }}
          />
          <TextWidget
            text={fallback ? w.fallbackText : w.emptyText}
            style={{ fontSize: 12, fontFamily: MEDIUM, color: C.muted }}
          />
        </FlexWidget>
      ) : (
        items.slice(0, rows).map((it) => <Row key={it.event.id} item={it} />)
      )}
    </FlexWidget>
  );
}
