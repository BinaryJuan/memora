import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon, TAG_ICONS } from '@/components/icon';
import { OffsetPicker } from '@/components/offset-picker';
import { Button, Card, Divider, Field, Header, Row, Screen, Sheet, SwitchRow, T } from '@/components/ui';
import { offsetsSummary, TAG_COLORS } from '@/lib/kinds';
import type { Tag } from '@/lib/types';
import { LIMITS } from '@/lib/validation';
import { newId, useStore } from '@/store/store';
import { Space, tint, useTheme } from '@/theme/theme';


export default function TagsScreen() {
  const { c } = useTheme();
  const tags = useStore((s) => s.tags);
  const events = useStore((s) => s.events);
  const settings = useStore((s) => s.settings);
  const saveTag = useStore((s) => s.saveTag);
  const deleteTag = useStore((s) => s.deleteTag);
  const [editing, setEditing] = useState<Tag | null>(null);

  const startNew = () =>
    setEditing({ id: newId(), name: '', icon: 'star', color: TAG_COLORS[tags.length % TAG_COLORS.length] });

  const save = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return Alert.alert('Falta el nombre', 'Poné un nombre a la etiqueta.');
    if (tags.some((t) => t.id !== editing.id && t.name.toLowerCase() === name.toLowerCase()))
      return Alert.alert('Ya existe', `Ya tenés una etiqueta que se llama «${name}».`);
    if (!tags.some((t) => t.id === editing.id) && tags.length >= LIMITS.tags)
      return Alert.alert('Demasiadas etiquetas', 'Borrá alguna antes de crear otra.');
    saveTag({ ...editing, name });
    setEditing(null);
  };

  const remove = () => {
    if (!editing) return;
    const count = events.filter((e) => e.tagIds.includes(editing.id)).length;
    Alert.alert(
      'Borrar etiqueta',
      count > 0 ? `Se va a quitar de ${count} ${count === 1 ? 'fecha' : 'fechas'}. Las fechas no se borran.` : '¿Seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            deleteTag(editing.id);
            setEditing(null);
          },
        },
      ],
    );
  };

  const isExisting = editing ? tags.some((t) => t.id === editing.id) : false;

  return (
    <Screen>
      <Header title="Etiquetas" />
      <T muted style={{ marginBottom: Space.lg }}>
        Agrupá a las personas por tipo. Cada etiqueta puede tener sus propios avisos.
      </T>
      <Card style={{ paddingVertical: Space.xs }}>
        {tags.map((t, i) => {
          const count = events.filter((e) => e.tagIds.includes(t.id)).length;
          return (
            <View key={t.id}>
              {i > 0 ? <Divider /> : null}
              <Row
                badge={{ icon: t.icon, color: t.color }}
                title={t.name}
                subtitle={`${count} ${count === 1 ? 'fecha' : 'fechas'}${t.reminderOffsets ? ' · avisos propios' : ''}`}
                onPress={() => setEditing(t)}
                right={<View style={[styles.swatch, { backgroundColor: t.color }]} />}
              />
            </View>
          );
        })}
        {tags.length === 0 ? <T muted style={{ paddingVertical: Space.md }}>No hay etiquetas.</T> : null}
      </Card>
      <Button label="Nueva etiqueta" icon="plus" variant="secondary" onPress={startNew} style={{ marginTop: Space.lg }} />

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title={isExisting ? 'Editar etiqueta' : 'Nueva etiqueta'}>
        {editing ? (
          <>
            <Field
              label="Nombre"
              placeholder="Ej: Facultad"
              maxLength={LIMITS.tagName}
              value={editing.name}
              onChangeText={(name) => setEditing({ ...editing, name })}
              autoFocus={!isExisting}
            />
            <T variant="label">Ícono</T>
            <View style={styles.wrap}>
              {TAG_ICONS.map((e) => (
                <Pressable
                  key={e}
                  accessibilityLabel={e}
                  onPress={() => setEditing({ ...editing, icon: e })}
                  style={[
                    styles.iconCell,
                    { backgroundColor: editing.icon === e ? tint(editing.color, 0.2) : c.surface, borderColor: editing.icon === e ? editing.color : c.border },
                  ]}>
                  <Icon name={e} size={24} accent={editing.color} />
                </Pressable>
              ))}
            </View>
            <T variant="label">Color</T>
            <View style={styles.wrap}>
              {TAG_COLORS.map((col) => (
                <Pressable
                  key={col}
                  accessibilityLabel={`Color ${col}`}
                  onPress={() => setEditing({ ...editing, color: col })}
                  style={[styles.color, { backgroundColor: col, borderColor: editing.color === col ? c.text : 'transparent' }]}
                />
              ))}
            </View>
            <Card style={{ paddingVertical: Space.xs }}>
              <SwitchRow
                icon="bell"
                title="Avisos propios"
                subtitle={editing.reminderOffsets ? 'Para todas las fechas con esta etiqueta' : `Usa los de Ajustes: ${offsetsSummary(settings.defaultOffsets)}`}
                value={!!editing.reminderOffsets}
                onChange={(on) => setEditing({ ...editing, reminderOffsets: on ? settings.defaultOffsets : undefined })}
              />
              {editing.reminderOffsets ? (
                <View style={{ paddingBottom: Space.md }}>
                  <OffsetPicker
                    value={editing.reminderOffsets}
                    onChange={(reminderOffsets) => setEditing({ ...editing, reminderOffsets })}
                  />
                </View>
              ) : null}
            </Card>
            <Button label="Guardar" icon="check" onPress={save} />
            {isExisting ? <Button label="Borrar etiqueta" icon="trash-2" variant="danger" onPress={remove} /> : null}
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 14, height: 14, borderRadius: 7 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  iconCell: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  color: { width: 38, height: 38, borderRadius: 19, borderWidth: 3 },
});
