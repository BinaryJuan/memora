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
import { LANG_NAMES, LANGS, strings } from '@/i18n/core';
import type { BackupData, LanguagePref, ThemeMode } from '@/lib/types';
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
  const s = strings().settings;

  const toggleNotifications = async (on: boolean) => {
    if (on && !(await ensurePermission())) {
      Alert.alert(s.permissionNeeded, s.permissionNeededText);
      return;
    }
    update({ notificationsEnabled: on });
  };

  const toggleLock = async (on: boolean) => {
    if (on) {
      // Alcanza con cualquier bloqueo del teléfono (huella, PIN o patrón).
      const ok = (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
      if (!ok) {
        Alert.alert(strings().common.notAvailable, s.lockUnavailable);
        return;
      }
    }
    if (await authenticate(on ? s.lockConfirmOn : s.lockConfirmOff)) {
      update({ lockEnabled: on });
    }
  };

  const doExport = async () => {
    const { events, tags, templates, notes, settings } = useStore.getState();
    try {
      await exportBackup({ events, tags, templates, notes, settings });
    } catch {
      Alert.alert(strings().common.oops, s.exportFailed);
    }
  };

  const replaceAll = (data: BackupData) => {
    const { events: current, notes } = useStore.getState();
    Alert.alert(
      s.replaceTitle,
      s.replaceText(current.length, notes.length),
      [
        { text: strings().common.cancel, style: 'cancel' },
        {
          text: s.replace,
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
      Alert.alert(s.importFailed, e instanceof BackupError ? e.message : s.readFailed);
      return;
    }
    if (!data) return;
    const noteCount = data.notes?.length ?? 0;
    if (data.events.length === 0 && noteCount === 0) {
      Alert.alert(s.emptyBackup, s.emptyBackupText);
      return;
    }
    const backup = data;
    Alert.alert(s.importTitle, s.importText(backup.events.length, noteCount), [
      { text: strings().common.cancel, style: 'cancel' },
      { text: s.merge, onPress: () => useStore.getState().importBackup(backup, 'merge') },
      { text: s.replaceAll, style: 'destructive', onPress: () => replaceAll(backup) },
    ]);
  };

  const testNotification = async () => {
    if (!(await ensurePermission())) {
      Alert.alert(s.permissionNeeded, s.permissionNeededText);
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
      <PageTitle title={s.title} />

      <Section title={s.appearance}>
        <Segmented<ThemeMode>
          options={[
            { id: 'system', label: s.themeSystem },
            { id: 'light', label: s.themeLight },
            { id: 'dark', label: s.themeDark },
          ]}
          value={settings.theme}
          onChange={(theme) => update({ theme })}
        />
      </Section>

      <Section title={s.language}>
        <Segmented<LanguagePref>
          options={[
            { id: 'system', label: s.languageSystem },
            ...LANGS.map((id) => ({ id, label: LANG_NAMES[id] })),
          ]}
          value={settings.language}
          onChange={(language) => update({ language })}
        />
      </Section>

      <Section title={s.notifications}>
        <Card style={{ paddingVertical: Space.xs }}>
          <SwitchRow
            icon="bell"
            title={s.notifyMe}
            value={settings.notificationsEnabled}
            onChange={toggleNotifications}
          />
          {settings.notificationsEnabled ? (
            <>
              <Divider />
              <Row
                icon="clock"
                title={s.notifyHour}
                subtitle={formatHour(settings.notifyHour)}
                right={
                  <View style={{ flexDirection: 'row', gap: Space.xs }}>
                    <IconButton
                      icon="minus"
                      filled
                      label={s.earlier}
                      onPress={() => update({ notifyHour: (settings.notifyHour + 23) % 24 })}
                    />
                    <IconButton
                      icon="plus"
                      filled
                      label={s.laterHour}
                      onPress={() => update({ notifyHour: (settings.notifyHour + 1) % 24 })}
                    />
                  </View>
                }
              />
              <Divider />
              <View style={{ paddingVertical: Space.md, gap: Space.sm }}>
                <T style={{ fontFamily: Fonts.medium }}>{s.whenToNotify}</T>
                <T variant="small" muted>
                  {s.whenToNotifyHint}
                </T>
                <OffsetPicker value={settings.defaultOffsets} onChange={(defaultOffsets) => update({ defaultOffsets })} />
              </View>
              <Divider />
              <SwitchRow
                icon="inbox"
                title={s.weekly}
                subtitle={s.weeklyHint}
                value={settings.weeklySummary}
                onChange={(weeklySummary) => update({ weeklySummary })}
              />
              {Platform.OS !== 'web' ? (
                <>
                  <Divider />
                  <Row icon="send" title={s.test} subtitle={s.testHint} onPress={testNotification} />
                </>
              ) : null}
              {exactMissing ? (
                <>
                  <Divider />
                  <Row
                    icon="watch"
                    title={s.exact}
                    subtitle={s.exactHint}
                    onPress={fixTiming}
                  />
                </>
              ) : null}
            </>
          ) : null}
          {Platform.OS !== 'web' ? (
            <>
              <Divider />
              <SwitchRow
                icon="music"
                title={s.sound}
                subtitle={s.soundHint}
                value={settings.birthdaySound}
                onChange={(birthdaySound) => update({ birthdaySound })}
              />
            </>
          ) : null}
        </Card>
      </Section>

      <Section title={s.organize}>
        <Card style={{ paddingVertical: Space.xs }}>
          <Row icon="tag" title={s.tags} subtitle={s.tagsHint} onPress={() => router.push('/tags')} />
          <Divider />
          <Row
            icon="message-square"
            title={s.templates}
            subtitle={s.templatesHint}
            onPress={() => router.push('/templates')}
          />
          <Divider />
          <Row icon="bar-chart-2" title={s.stats} onPress={() => router.push('/stats')} />
        </Card>
      </Section>

      <Section title={s.data}>
        <Card style={{ paddingVertical: Space.xs }}>
          <Row
            icon="users"
            title={s.importContacts}
            subtitle={s.importContactsHint}
            onPress={() => router.push('/import-contacts')}
          />
          <Divider />
          <Row
            icon="upload"
            title={s.exportBackup}
            subtitle={s.exportBackupHint}
            onPress={doExport}
          />
          <Divider />
          <Row icon="download" title={s.importBackup} onPress={doImport} />
        </Card>
      </Section>

      {Platform.OS !== 'web' ? (
        <Section title={s.privacy}>
          <Card style={{ paddingVertical: Space.xs }}>
            <SwitchRow
              icon="lock"
              title={s.lock}
              subtitle={s.lockHint}
              value={settings.lockEnabled}
              onChange={toggleLock}
            />
          </Card>
        </Section>
      ) : null}

      <T variant="small" muted style={{ textAlign: 'center', marginTop: Space.xxl }}>
        {s.footer}
      </T>
    </Screen>
  );
}
