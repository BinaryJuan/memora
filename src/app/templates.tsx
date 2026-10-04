import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Card, Field, Header, Screen, Sheet, T } from '@/components/ui';
import { strings } from '@/i18n/core';
import type { Template } from '@/lib/types';
import { LIMITS } from '@/lib/validation';
import { newId, useStore } from '@/store/store';
import { Radius, Space, useTheme } from '@/theme/theme';

export default function TemplatesScreen() {
  const { c } = useTheme();
  const templates = useStore((s) => s.templates);
  const saveTemplate = useStore((s) => s.saveTemplate);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const [editing, setEditing] = useState<Template | null>(null);

  const s = strings().templates;
  const isExisting = editing ? templates.some((t) => t.id === editing.id) : false;

  const save = () => {
    if (!editing?.text.trim()) return;
    if (!templates.some((t) => t.id === editing.id) && templates.length >= LIMITS.templates)
      return Alert.alert(s.tooMany, s.tooManyText);
    saveTemplate({ ...editing, text: editing.text.trim() });
    setEditing(null);
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert(s.deleteTitle, strings().common.sure, [
      { text: strings().common.cancel, style: 'cancel' },
      {
        text: strings().common.delete,
        style: 'destructive',
        onPress: () => {
          deleteTemplate(editing.id);
          setEditing(null);
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title={s.title} />
      <T muted style={{ marginBottom: Space.lg }}>
        {s.introBefore}
        <T style={{ color: c.accent }}>{s.nameToken}</T>
        {s.introAnd}
        <T style={{ color: c.accent }}>{s.ageToken}</T>
        {s.introAfter}
      </T>
      <View style={{ gap: Space.md }}>
        {templates.map((t) => (
          <Pressable key={t.id} onPress={() => setEditing(t)}>
            <Card>
              <T>{t.text}</T>
            </Card>
          </Pressable>
        ))}
      </View>
      <Button
        label={s.newTemplate}
        icon="plus"
        variant="secondary"
        onPress={() => setEditing({ id: newId(), text: '' })}
        style={{ marginTop: Space.lg }}
      />

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title={isExisting ? s.editTemplate : s.newTemplate}>
        {editing ? (
          <>
            <Field
              placeholder={s.placeholder}
              value={editing.text}
              onChangeText={(text) => setEditing({ ...editing, text })}
              maxLength={LIMITS.template}
              multiline
              autoFocus
              style={{ minHeight: 120, borderRadius: Radius.md }}
            />
            <Button label={strings().common.save} icon="check" onPress={save} />
            {isExisting ? <Button label={strings().common.delete} icon="trash-2" variant="danger" onPress={remove} /> : null}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
