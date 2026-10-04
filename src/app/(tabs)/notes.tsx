import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, Fab, Field, PageTitle, Screen, Section, T } from '@/components/ui';
import { strings } from '@/i18n/core';
import { normalizeSearch } from '@/lib/events';
import type { Note } from '@/lib/types';
import { useStore } from '@/store/store';
import { Radius, Space, tint, useTheme } from '@/theme/theme';

/** Alto aproximado de una tarjeta, para repartir las notas en dos columnas parejas. */
function estimate(n: Note): number {
  const lines = Math.min(10, Math.ceil(n.text.length / 22) + (n.text.match(/\n/g)?.length ?? 0));
  return (n.title ? 2 : 0) + Math.max(1, lines);
}

function columns(notes: Note[]): [Note[], Note[]] {
  const cols: [Note[], Note[]] = [[], []];
  const heights = [0, 0];
  for (const n of notes) {
    const i = heights[0] <= heights[1] ? 0 : 1;
    cols[i].push(n);
    heights[i] += estimate(n) + 2;
  }
  return cols;
}

function NoteCard({ note }: { note: Note }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/note/[id]', params: { id: note.id } })}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: note.color ? tint(note.color, 0.22) : c.surface,
          borderColor: note.color ? tint(note.color, 0.5) : c.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {note.title ? (
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
          <T variant="heading" numberOfLines={2} style={{ flex: 1 }}>
            {note.title}
          </T>
          {note.pinned ? <Feather name="bookmark" size={14} color={c.textMuted} style={{ marginTop: 3 }} /> : null}
        </View>
      ) : null}
      {note.text ? (
        <T variant="small" numberOfLines={10} style={{ lineHeight: 19 }}>
          {note.text}
        </T>
      ) : null}
    </Pressable>
  );
}

function Masonry({ notes }: { notes: Note[] }) {
  const [left, right] = columns(notes);
  return (
    <View style={styles.masonry}>
      {[left, right].map((col, i) => (
        <View key={i} style={styles.column}>
          {col.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function NotesScreen() {
  const notes = useStore((s) => s.notes);
  const [query, setQuery] = useState('');
  const s = strings().notes;

  const { pinned, others } = useMemo(() => {
    const q = normalizeSearch(query.trim());
    const found = notes
      .filter((n) => !q || normalizeSearch(`${n.title} ${n.text}`).includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { pinned: found.filter((n) => n.pinned), others: found.filter((n) => !n.pinned) };
  }, [notes, query]);

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <PageTitle kicker={notes.length ? s.count(notes.length) : undefined} title={s.title} />
        {notes.length > 0 ? (
          <Field
            placeholder={s.search}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        ) : null}

        {notes.length === 0 ? (
          <EmptyState icon="note" title={s.emptyTitle} text={s.emptyText} />
        ) : pinned.length + others.length === 0 ? (
          <EmptyState icon="search" title={s.noResults} text={s.noResultsText} />
        ) : null}

        {pinned.length > 0 ? (
          <Section title={s.pinned}>
            <Masonry notes={pinned} />
          </Section>
        ) : null}
        {others.length > 0 ? (
          pinned.length > 0 ? (
            <Section title={s.others}>
              <Masonry notes={others} />
            </Section>
          ) : (
            <View style={{ marginTop: Space.lg }}>
              <Masonry notes={others} />
            </View>
          )
        ) : null}
      </Screen>
      <Fab label={s.newNote} onPress={() => router.push({ pathname: '/note/[id]', params: { id: 'nueva' } })} />
    </View>
  );
}

const styles = StyleSheet.create({
  masonry: { flexDirection: 'row', gap: Space.sm, alignItems: 'flex-start' },
  column: { flex: 1, gap: Space.sm },
  card: { borderWidth: 1, borderRadius: Radius.md, padding: Space.md, gap: 6 },
});
