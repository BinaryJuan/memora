import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Button, Card, Field, Header, Screen, Sheet, T } from '@/components/ui';
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

  const isExisting = editing ? templates.some((t) => t.id === editing.id) : false;

  const save = () => {
    if (!editing?.text.trim()) return;
    if (!templates.some((t) => t.id === editing.id) && templates.length >= LIMITS.templates)
      return Alert.alert('Demasiados mensajes', 'Borrá alguno antes de crear otro.');
    saveTemplate({ ...editing, text: editing.text.trim() });
    setEditing(null);
  };

  const remove = () => {
    if (!editing) return;
    Alert.alert('Borrar mensaje', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
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
      <Header title="Mensajes de saludo" />
      <T muted style={{ marginBottom: Space.lg }}>
        Escribí <T style={{ color: c.accent }}>{'{nombre}'}</T> y <T style={{ color: c.accent }}>{'{edad}'}</T> y Memora los
        completa al saludar.
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
        label="Nuevo mensaje"
        icon="plus"
        variant="secondary"
        onPress={() => setEditing({ id: newId(), text: '' })}
        style={{ marginTop: Space.lg }}
      />

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title={isExisting ? 'Editar mensaje' : 'Nuevo mensaje'}>
        {editing ? (
          <>
            <Field
              placeholder="¡Feliz cumple, {nombre}!"
              value={editing.text}
              onChangeText={(text) => setEditing({ ...editing, text })}
              maxLength={LIMITS.template}
              multiline
              autoFocus
              style={{ minHeight: 120, borderRadius: Radius.md }}
            />
            <Button label="Guardar" icon="check" onPress={save} />
            {isExisting ? <Button label="Borrar" icon="trash-2" variant="danger" onPress={remove} /> : null}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
