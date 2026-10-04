import * as LocalAuthentication from 'expo-local-authentication';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { authenticate } from '@/components/lock-gate';
import { OffsetPicker } from '@/components/offset-picker';
import { Card, Divider, IconButton, PageTitle, Row, Screen, Section, Segmented, SwitchRow, T } from '@/components/ui';
import { deletePhoto, exportBackup, pickBackup } from '@/lib/media';
import {
  ensurePermission,
  exactAlarmsMissing,
  openExactAlarmSettings,
  sendTestNotification,
} from '@/lib/notifications';
import type { BackupData, ThemeMode } from '@/lib/types';
import { BackupError } from '@/lib/validation';
import { useStore } from '@/store/store';
import { Fonts, Space } from '@/theme/theme';

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

export default function SettingsScreen() {
  const settings = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  // Se vuelve a mirar al entrar a esta pestaña: el permiso se puede cambiar desde los ajustes del teléfono.
  const [exactMissing, setExactMissing] = useState(exactAlarmsMissing);
  useFocusEffect(useCallback(() => setExactMissing(exactAlarmsMissing()), []));

  const toggleNotifications = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      Alert.alert('Permiso necesario', 'Activá las notificaciones de Memora en los ajustes del teléfono.');
      return;
    }
    update({ notificationsEnabled: on });
  };

  const toggleLock = async (on: boolean) => {
    if (on) {
      // Alcanza con cualquier bloqueo del teléfono (huella, PIN o patrón).
      const ok = (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
      if (!ok) {
        Alert.alert('No disponible', 'Configurá una huella o un PIN en el teléfono para usar el bloqueo.');
        return;
      }
    }
    if (await authenticate(on ? 'Confirmá para activar el bloqueo' : 'Confirmá para quitar el bloqueo')) {
      update({ lockEnabled: on });
    }
  };

  const doExport = async () => {
    const { events, tags, templates, settings } = useStore.getState();
    try {
      await exportBackup({ events, tags, templates, settings });
    } catch {
      Alert.alert('Ups', 'No se pudo crear el respaldo.');
    }
  };

  const replaceAll = (data: BackupData) => {
    const current = useStore.getState().events;
    Alert.alert(
      '¿Reemplazar todo?',
      `Se van a borrar tus ${current.length} fechas actuales y quedan solo las del respaldo. No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reemplazar',
          style: 'destructive',
          onPress: () => {
            // Las fotos de recuerdos que ya no usa nadie se borran del teléfono.
            const kept = new Set(data.events.flatMap((e) => e.memories.map((m) => m.photoUri)));
            current.flatMap((e) => e.memories).forEach((m) => !kept.has(m.photoUri) && deletePhoto(m.photoUri));
            useStore.getState().importBackup(data, 'replace');
          },
        },
      ],
    );
  };

  const doImport = async () => {
    let data: BackupData | null;
    try {
      data = await pickBackup(useStore.getState().settings);
    } catch (e) {
      Alert.alert('No se pudo importar', e instanceof BackupError ? e.message : 'No pudimos leer el archivo.');
      return;
    }
    if (!data) return;
    if (data.events.length === 0) {
      Alert.alert('Respaldo vacío', 'El archivo no tiene fechas para importar.');
      return;
    }
    const backup = data;
    const n = backup.events.length;
    Alert.alert('Importar respaldo', `El archivo tiene ${n} ${n === 1 ? 'fecha' : 'fechas'}. ¿Qué querés hacer?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sumar a las mías', onPress: () => useStore.getState().importBackup(backup, 'merge') },
      { text: 'Reemplazar todo', style: 'destructive', onPress: () => replaceAll(backup) },
    ]);
  };

  const testNotification = async () => {
    if (!(await ensurePermission())) {
      Alert.alert('Permiso necesario', 'Activá las notificaciones de Memora en los ajustes del teléfono.');
      return;
    }
    await sendTestNotification();
  };

  const fixTiming = async () => {
    // Al volver, si se dio el permiso, los avisos se reprograman solos (ver `_layout.tsx`).
    await openExactAlarmSettings();
    setExactMissing(exactAlarmsMissing());
  };

  return (
    <Screen>
      <PageTitle title="Ajustes" />

      <Section title="Apariencia">
        <Segmented<ThemeMode>
          options={[
            { id: 'system', label: 'Automático' },
            { id: 'light', label: 'Claro' },
            { id: 'dark', label: 'Oscuro' },
          ]}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
        />
      </Section>

      <Section title="Avisos">
        <Card style={{ paddingVertical: Space.xs }}>
          <SwitchRow
            icon="bell"
            title="Avisarme de las fechas"
            value={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
          {settings.notificationsEnabled ? (
            <>
              <Divider />
              <Row
                icon="clock"
                title="Hora de los avisos"
                subtitle={formatHour(settings.notifyHour)}
                right={
                  <View style={{ flexDirection: 'row', gap: Space.xs }}>
                    <IconButton
                      icon="minus"
                      filled
                      label="Más temprano"
                      onPress={() => update({ notifyHour: (settings.notifyHour + 23) % 24 })}
                    />
                    <IconButton
                      icon="plus"
                      filled
                      label="Más tarde"
                      onPress={() => update({ notifyHour: (settings.notifyHour + 1) % 24 })}
                    />
                  </View>
                }
              />
              <Divider />
              <View style={{ paddingVertical: Space.md, gap: Space.sm }}>
                <T style={{ fontFamily: Fonts.medium }}>Cuándo avisar</T>
                <T variant="small" muted>
                  Se usa para todas las fechas, salvo las que tengan avisos propios o por etiqueta.
                </T>
                <OffsetPicker value={settings.defaultOffsets} onChange={(defaultOffsets) => update({ defaultOffsets })} />
              </View>
              <Divider />
              <SwitchRow
                icon="inbox"
                title="Resumen semanal"
                subtitle="Los lunes, lo que viene en la semana"
                value={settings.weeklySummary}
                onChange={(weeklySummary) => update({ weeklySummary })}
              />
              {Platform.OS !== 'web' ? (
                <>
                  <Divider />
                  <Row icon="send" title="Probar un aviso" subtitle="Llega en 3 segundos" onPress={testNotification} />
                </>
              ) : null}
              {exactMissing ? (
                <>
                  <Divider />
                  <Row
                    icon="watch"
                    title="Avisos a la hora justa"
                    subtitle="Android puede atrasarlos. Tocá para permitir «Alarmas y recordatorios»"
                    onPress={fixTiming}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </Card>
      </Section>

      <Section title="Organizar">
        <Card style={{ paddingVertical: Space.xs }}>
          <Row icon="tag" title="Etiquetas" subtitle="Familia, amigos, trabajo…" onPress={() => router.push('/tags')} />
          <Divider />
          <Row
            icon="message-square"
            title="Mensajes de saludo"
            subtitle="Plantillas para saludar rápido"
            onPress={() => router.push('/templates')}
          />
          <Divider />
          <Row icon="bar-chart-2" title="Estadísticas" onPress={() => router.push('/stats')} />
        </Card>
      </Section>

      <Section title="Tus datos">
        <Card style={{ paddingVertical: Space.xs }}>
          <Row
            icon="users"
            title="Importar desde contactos"
            subtitle="Cumpleaños y aniversarios guardados"
            onPress={() => router.push('/import-contacts')}
          />
          <Divider />
          <Row
            icon="upload"
            title="Exportar respaldo"
            subtitle="Podés guardarlo en Google Drive"
            onPress={doExport}
          />
          <Divider />
          <Row icon="download" title="Importar respaldo" onPress={doImport} />
        </Card>
      </Section>

      {Platform.OS !== 'web' ? (
        <Section title="Privacidad">
          <Card style={{ paddingVertical: Space.xs }}>
            <SwitchRow
              icon="lock"
              title="Bloquear con huella o PIN"
              subtitle="Se pide al abrir la app"
              value={settings.lockEnabled}
              onChange={toggleLock}
            />
          </Card>
        </Section>
      ) : null}

      <T variant="small" muted style={{ textAlign: 'center', marginTop: Space.xxl }}>
        Memora · versión 1.0{'\n'}Tus datos se guardan solo en este teléfono.
      </T>
    </Screen>
  );
}
