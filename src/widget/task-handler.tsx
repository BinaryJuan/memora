import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetInfo, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { upcomingList } from '@/lib/events';
import type { MemoraEvent } from '@/lib/types';
import { NextDatesWidget } from './next-dates-widget';

export const WIDGET_NAME = 'ProximasFechas';

/** Cuántas filas entran según el alto del widget (en dp). */
function rowsFor(info: WidgetInfo): number {
  return Math.max(1, Math.min(5, Math.floor((info.height - 44) / 52)));
}

/**
 * El widget corre aunque la app esté cerrada, sin el store en memoria:
 * leemos directo lo que guardó la app.
 */
async function loadEvents(): Promise<MemoraEvent[]> {
  try {
    const raw = await AsyncStorage.getItem('memora-data');
    const events = raw ? JSON.parse(raw)?.state?.events : null;
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

export async function renderNextDates(info: WidgetInfo, events?: MemoraEvent[]) {
  const list = upcomingList(events ?? (await loadEvents()));
  return <NextDatesWidget items={list} rows={rowsFor(info)} />;
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== WIDGET_NAME) return;
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(await renderNextDates(props.widgetInfo));
      break;
    default:
      break;
  }
}
