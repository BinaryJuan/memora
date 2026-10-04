// El widget no es una pantalla de React: la librería recorre los componentes como funciones comunes,
// y lo que agrega el React Compiler (memoria en caché) la rompe. Por eso se desactiva acá.
'use no memo';

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetInfo, WidgetTaskHandlerProps } from 'react-native-android-widget';

import { setLanguage, type LangPref } from '@/i18n/core';
import { upcomingList } from '@/lib/events';
import type { MemoraEvent } from '@/lib/types';
import { NextDatesWidget } from './next-dates-widget';

export const WIDGET_NAME = 'ProximasFechas';

/** Cuántas filas entran según el alto del widget (en dp). */
function rowsFor(info: WidgetInfo): number {
  // Cada fila ocupa ~72dp con su separación. En el celular de prueba (Samsung, 4×2) con 52 entraban
  // tres filas y la tercera salía aplastada, sin la fecha: mejor mostrar solo las que entran enteras.
  return Math.max(1, Math.min(5, Math.floor((info.height - 44) / 72)));
}

/**
 * El widget corre aunque la app esté cerrada, sin el store en memoria:
 * leemos directo lo que guardó la app.
 */
async function loadEvents(): Promise<MemoraEvent[]> {
  try {
    const raw = await AsyncStorage.getItem('memora-data');
    const state = raw ? JSON.parse(raw)?.state : null;
    // Con la app cerrada, el idioma elegido en Ajustes solo está en lo guardado.
    setLanguage(state?.settings?.language as LangPref | undefined);
    const events = state?.events;
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

export async function renderNextDates(info: WidgetInfo, events?: MemoraEvent[]) {
  const list = upcomingList(events ?? (await loadEvents()));
  return <NextDatesWidget items={list} rows={rowsFor(info)} />;
}

const DRAW_ACTIONS = new Set<WidgetTaskHandlerProps['widgetAction']>(['WIDGET_ADDED', 'WIDGET_UPDATE', 'WIDGET_RESIZED']);

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== WIDGET_NAME || !DRAW_ACTIONS.has(props.widgetAction)) return;
  try {
    props.renderWidget(await renderNextDates(props.widgetInfo));
  } catch (err) {
    // Nunca dejarlo vacío: si algo falla, al menos un cartel que lleve a la app.
    console.warn('No se pudo dibujar el widget', err);
    props.renderWidget(<NextDatesWidget items={[]} rows={1} fallback />);
  }
}
