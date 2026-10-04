import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { showToast } from '@/components/toast';
import { IconButton, Sheet, T, tap } from '@/components/ui';
import { strings } from '@/i18n/core';
import { formatDayMonth } from '@/lib/dates';
import { NOTE_COLORS } from '@/lib/kinds';
import type { Note } from '@/lib/types';
import { LIMITS } from '@/lib/validation';
import { newId, useStore } from '@/store/store';
import { Fonts, Radius, Space, tint, useTheme } from '@/theme/theme';

type Draft = Pick<Note, 'title' | 'text' | 'color' | 'pinned'>;

function editedLabel(time: number): string {
  const d = new Date(time);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return strings().notes.edited(`${formatDayMonth(d.getDate(), d.getMonth() + 1)} · ${hh}:${mm}`);
}

/**
 * Editor de una nota. No hay botón "Guardar": se guarda sola mientras se escribe y al salir,
 * como en Keep. Una nota que queda vacía no se guarda (y si ya existía, se borra).
 */
export default function NoteScreen() {
  const { c } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const existing = useStore((st) => st.notes.find((n) => n.id === id));
  const s = strings().notes;

  const [noteId] = useState(() => existing?.id ?? newId());
  const [createdAt] = useState(() => existing?.createdAt ?? Date.now());
  const [title, setTitle] = useState(existing?.title ?? '');
  const [text, setText] = useState(existing?.text ?? '');
  const [color, setColor] = useState(existing?.color);
  const [pinned, setPinned] = useState(existing?.pinned ?? false);
  const [colorSheet, setColorSheet] = useState(false);
  const draft = useRef<Draft>({ title, text, color, pinned });
  const removed = useRef(false);
  const saved = useStore((st) => st.notes.find((n) => n.id === noteId));

  const persist = (v: Draft) => {
    if (removed.current) return;
    const { notes, saveNote, deleteNote } = useStore.getState();
    const prev = notes.find((n) => n.id === noteId);
    if (!v.title.trim() && !v.text.trim()) {
      if (prev) deleteNote(noteId);
      return;
    }
    if (prev && prev.title === v.title && prev.text === v.text && prev.color === v.color && prev.pinned === v.pinned) return;
    if (!prev && notes.length >= LIMITS.noteCount) return;
    saveNote({ id: noteId, ...v, createdAt, updatedAt: Date.now() });
  };

  // Guarda un ratito después de dejar de escribir…
  useEffect(() => {
    draft.current = { title, text, color, pinned };
    const timer = setTimeout(() => persist(draft.current), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, text, color, pinned]);

  // …y sí o sí al salir de la pantalla.
  useEffect(
    () => () => persist(draft.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const remove = () => {
    const snapshot = useStore.getState().notes.find((n) => n.id === noteId);
    removed.current = true;
    router.back();
    if (!snapshot) return;
    useStore.getState().deleteNote(noteId);
    showToast({
      message: s.deleted,
      actionLabel: strings().common.undo,
      onAction: () => useStore.getState().restoreNote(snapshot),
    });
  };

  const bg = color ? tint(color, 0.18) : 'transparent';

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} />
      <View style={styles.header}>
        <IconButton icon="arrow-left" label={strings().common.back} onPress={() => router.back()} />
        <View style={{ flex: 1 }} />
        <IconButton
          icon="bookmark"
          label={pinned ? s.unpin : s.pin}
          color={pinned ? c.accent : c.text}
          onPress={() => {
            tap();
            setPinned(!pinned);
          }}
        />
        <IconButton icon="droplet" label={s.color} onPress={() => setColorSheet(true)} />
        <IconButton icon="trash-2" label={s.deleteNote} onPress={remove} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.body, { paddingBottom: bottom + Space.xl }]}
        keyboardShouldPersistTaps="handled">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={s.titlePlaceholder}
          placeholderTextColor={c.textMuted}
          maxLength={LIMITS.noteTitle}
          style={[styles.title, { color: c.text }]}
          multiline
          submitBehavior="blurAndSubmit"
        />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={s.textPlaceholder}
          placeholderTextColor={c.textMuted}
          maxLength={LIMITS.noteText}
          multiline
          autoFocus={!existing}
          textAlignVertical="top"
          style={[styles.text, { color: c.text }]}
        />
        {saved ? (
          <T variant="small" muted style={{ textAlign: 'center' }}>
            {editedLabel(saved.updatedAt)}
          </T>
        ) : null}
      </ScrollView>

      <Sheet visible={colorSheet} onClose={() => setColorSheet(false)} title={s.color}>
        <View style={styles.colors}>
          <Pressable
            accessibilityLabel={s.colorNone}
            onPress={() => {
              tap();
              setColor(undefined);
              setColorSheet(false);
            }}
            style={[styles.swatch, { backgroundColor: c.surface, borderColor: !color ? c.text : c.border }]}>
            <T variant="small" muted>
              ∅
            </T>
          </Pressable>
          {NOTE_COLORS.map((col) => (
            <Pressable
              key={col}
              accessibilityLabel={strings().tags.colorA11y(col)}
              onPress={() => {
                tap();
                setColor(col);
                setColorSheet(false);
              }}
              style={[styles.swatch, { backgroundColor: col, borderColor: color === col ? c.text : 'transparent' }]}
            />
          ))}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.xs, paddingHorizontal: Space.lg, paddingVertical: Space.sm },
  body: { paddingHorizontal: Space.xl, gap: Space.md, flexGrow: 1 },
  title: { fontFamily: Fonts.display, fontSize: 24, letterSpacing: -0.5, paddingVertical: 4 },
  text: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 24, minHeight: 320, flexGrow: 1, paddingVertical: 4 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  swatch: { width: 44, height: 44, borderRadius: Radius.pill, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
});
