import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { MemoraEvent } from '@/lib/types';

/**
 * react-native-android-widget necesita código nativo que Expo Go no trae: si se importa ahí,
 * la app se cae al abrir. Por eso todo lo del widget se carga recién acá, y solo en la app compilada.
 * Además va todo envuelto en try/catch: si el widget falla, la app tiene que seguir andando.
 */
export const widgetsAvailable = Platform.OS === 'android' && !isRunningInExpoGo();

/* eslint-disable @typescript-eslint/no-require-imports -- carga diferida a propósito (ver arriba) */

export function registerWidget() {
  if (!widgetsAvailable) return;
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (err) {
    console.warn('No se pudo registrar el widget', err);
  }
}

/** Redibuja el widget con los datos actuales (si hay alguno en la pantalla de inicio). */
export function refreshWidget(events: MemoraEvent[]) {
  if (!widgetsAvailable) return;
  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const { renderNextDates, WIDGET_NAME } = require('./task-handler');
    requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: (info: unknown) => renderNextDates(info, events),
    }).catch(() => {});
  } catch (err) {
    console.warn('No se pudo actualizar el widget', err);
  }
}
