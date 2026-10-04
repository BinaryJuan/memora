import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { MemoraEvent } from '@/lib/types';

/**
 * react-native-android-widget necesita código nativo que Expo Go no trae: si se importa ahí,
 * la app se cae al abrir. Por eso todo lo del widget se carga recién acá, y solo en la app compilada.
 */
export const widgetsAvailable = Platform.OS === 'android' && !isRunningInExpoGo();

/* eslint-disable @typescript-eslint/no-require-imports -- carga diferida a propósito (ver arriba) */

export function registerWidget() {
  if (!widgetsAvailable) return;
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./task-handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

/** Redibuja el widget con los datos actuales (si hay alguno en la pantalla de inicio). */
export function refreshWidget(events: MemoraEvent[]) {
  if (!widgetsAvailable) return;
  const { requestWidgetUpdate } = require('react-native-android-widget');
  const { renderNextDates, WIDGET_NAME } = require('./task-handler');
  requestWidgetUpdate({
    widgetName: WIDGET_NAME,
    renderWidget: (info: unknown) => renderNextDates(info, events),
  }).catch(() => {});
}
