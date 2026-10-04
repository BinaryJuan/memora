import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Confetti } from '@/components/confetti';
import { Avatar } from '@/components/event-row';
import { Icon } from '@/components/icon';
import { ShareCardSheet } from '@/components/share-card';
import { showToast } from '@/components/toast';
import {
  Button,
  Card,
  Chip,
  ChipRow,
  Divider,
  EmptyState,
  Field,
  Header,
  IconButton,
  Screen,
  Section,
  Sheet,
  T,
  tap,
  type IconName,
} from '@/components/ui';
import { countdownLabel, dateKey, formatEventDate, isMilestone, zodiacSign } from '@/lib/dates';
import { effectiveOffsets, fillTemplate, upcomingOf } from '@/lib/events';
import { getKind, offsetsSummary } from '@/lib/kinds';
import { deletePhoto, greet, pickPhoto, type GreetChannel } from '@/lib/media';
import type { MemoraEvent } from '@/lib/types';
import { digitsOnly, LIMITS, MAX_YEAR, MIN_YEAR, parseBudget } from '@/lib/validation';
import { newId, useStore } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';

/** Vuelve a poner un ítem borrado, sobre el estado más reciente de la fecha. */
function restoreItem<K extends 'giftIdeas' | 'giftsGiven' | 'memories'>(
  eventId: string,
  key: K,
  item: MemoraEvent[K][number],
) {
  const { events, updateEvent } = useStore.getState();
  const current = events.find((e) => e.id === eventId);
  if (!current) return;
  const list = current[key] as MemoraEvent[K][number][];
  if (list.some((x) => x.id === item.id)) return;
  updateEvent(eventId, { [key]: [...list, item] } as Partial<MemoraEvent>);
}

function GreetButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.greetBtn, { backgroundColor: c.surfaceAlt, opacity: pressed ? 0.6 : 1 }]}>
      <Feather name={icon} size={20} color={c.text} />
      <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: c.text }}>{label}</Text>
    </Pressable>
  );
}

function GiftsSection({ event, occurrenceYear }: { event: MemoraEvent; occurrenceYear: number }) {
  const { c } = useTheme();
  const updateEvent = useStore((s) => s.updateEvent);
  const [text, setText] = useState('');
  const [budget, setBudget] = useState('');

  const add = () => {
    if (!text.trim()) return;
    if (event.giftIdeas.length >= LIMITS.listItems) return Alert.alert('Demasiadas ideas', 'Borrá alguna antes de sumar otra.');
    const b = budget.trim() ? parseBudget(budget) : undefined;
    if (b === null) return Alert.alert('Presupuesto inválido', 'Escribí solo el número, por ejemplo 15000.');
    updateEvent(event.id, {
      giftIdeas: [...event.giftIdeas, { id: newId(), text: text.trim(), budget: b }],
    });
    setText('');
    setBudget('');
  };

  const markGiven = (id: string) => {
    const idea = event.giftIdeas.find((g) => g.id === id);
    if (!idea) return;
    tap();
    updateEvent(event.id, {
      giftIdeas: event.giftIdeas.filter((g) => g.id !== id),
      giftsGiven: [...event.giftsGiven, { id: newId(), year: occurrenceYear, text: idea.text }],
    });
  };

  const removeIdea = (id: string) => {
    const idea = event.giftIdeas.find((g) => g.id === id);
    if (!idea) return;
    updateEvent(event.id, { giftIdeas: event.giftIdeas.filter((g) => g.id !== id) });
    showToast({
      message: 'Borraste una idea de regalo',
      actionLabel: 'Deshacer',
      onAction: () => restoreItem(event.id, 'giftIdeas', idea),
    });
  };
  const removeGiven = (id: string) => {
    const gift = event.giftsGiven.find((g) => g.id === id);
    if (!gift) return;
    updateEvent(event.id, { giftsGiven: event.giftsGiven.filter((g) => g.id !== id) });
    showToast({
      message: 'Borraste un regalo del historial',
      actionLabel: 'Deshacer',
      onAction: () => restoreItem(event.id, 'giftsGiven', gift),
    });
  };

  const total = event.giftIdeas.reduce((n, g) => n + (g.budget ?? 0), 0);
  const given = [...event.giftsGiven].sort((a, b) => b.year - a.year);

  return (
    <>
      <Section title="Ideas de regalo" action={total > 0 ? <T variant="small" muted>Total ${total.toLocaleString('es-AR')}</T> : undefined}>
        <Card style={{ gap: Space.sm }}>
          {event.giftIdeas.map((g) => (
            <View key={g.id} style={styles.listRow}>
              <Icon name="gift" size={22} />
              <View style={{ flex: 1 }}>
                <T>{g.text}</T>
                {g.budget ? <T variant="small" muted>${g.budget.toLocaleString('es-AR')}</T> : null}
              </View>
              <IconButton icon="check" label="Ya se lo regalé" color={c.success} onPress={() => markGiven(g.id)} />
              <IconButton icon="x" label="Borrar idea" color={c.textMuted} onPress={() => removeIdea(g.id)} />
            </View>
          ))}
          {event.giftIdeas.length > 0 ? <Divider /> : null}
          <View style={{ flexDirection: 'row', gap: Space.sm, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Field placeholder="Nueva idea…" value={text} onChangeText={setText} onSubmitEditing={add} maxLength={LIMITS.gift} />
            </View>
            <View style={{ width: 90 }}>
              <Field placeholder="$" value={budget} onChangeText={setBudget} keyboardType="decimal-pad" maxLength={14} />
            </View>
            <IconButton icon="plus" filled label="Agregar idea" onPress={add} />
          </View>
          <T variant="small" muted>
            Tocá ✓ cuando se lo regales y pasa al historial.
          </T>
        </Card>
      </Section>

      {given.length > 0 ? (
        <Section title="Regalos que ya hiciste">
          <Card style={{ gap: Space.xs }}>
            {given.map((g) => (
              <View key={g.id} style={styles.listRow}>
                <T variant="small" muted style={{ width: 44 }}>
                  {g.year}
                </T>
                <T style={{ flex: 1 }}>{g.text}</T>
                <IconButton icon="x" label="Borrar" color={c.textMuted} onPress={() => removeGiven(g.id)} />
              </View>
            ))}
          </Card>
        </Section>
      ) : null}
    </>
  );
}

function MemoriesSection({ event }: { event: MemoraEvent }) {
  const { c } = useTheme();
  const updateEvent = useStore((s) => s.updateEvent);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();

  const save = () => {
    const y = parseInt(year, 10);
    if (!text.trim() && !photo) return Alert.alert('Recuerdo vacío', 'Escribí algo o agregá una foto.');
    if (Number.isNaN(y) || y < MIN_YEAR || y > MAX_YEAR) return Alert.alert('Año inválido', 'Escribí el año con 4 cifras.');
    if (event.memories.length >= LIMITS.listItems) return Alert.alert('Demasiados recuerdos', 'Borrá alguno antes de sumar otro.');
    updateEvent(event.id, { memories: [...event.memories, { id: newId(), year: y, text: text.trim(), photoUri: photo }] });
    setOpen(false);
    setText('');
    setPhoto(undefined);
  };

  // Si se cierra sin guardar, la copia de la foto no queda ocupando lugar.
  const cancel = () => {
    deletePhoto(photo);
    setPhoto(undefined);
    setOpen(false);
  };

  const remove = (id: string) => {
    const m = event.memories.find((x) => x.id === id);
    if (!m) return;
    updateEvent(event.id, { memories: event.memories.filter((x) => x.id !== id) });
    showToast({
      message: `Borraste el recuerdo de ${m.year}`,
      actionLabel: 'Deshacer',
      onAction: () => restoreItem(event.id, 'memories', m),
      onExpire: () => deletePhoto(m.photoUri),
    });
  };

  const list = [...event.memories].sort((a, b) => b.year - a.year);

  return (
    <Section
      title="Recuerdos"
      action={
        <Pressable onPress={() => setOpen(true)}>
          <T variant="small" color={c.accent} style={{ fontFamily: Fonts.bold }}>
            + Agregar
          </T>
        </Pressable>
      }>
      {list.length === 0 ? (
        <Card>
          <T variant="small" muted>
            {getKind(event.kind).person
              ? 'Guardá cómo lo festejaron cada año: una foto, una anécdota, quiénes estuvieron.'
              : 'Anotá lo que pasó cada año, con una foto si querés.'}
          </T>
        </Card>
      ) : (
        <View style={{ gap: Space.md }}>
          {list.map((m) => (
            <Pressable key={m.id} onLongPress={() => remove(m.id)}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                {m.photoUri ? <Image source={{ uri: m.photoUri }} style={{ height: 180 }} contentFit="cover" /> : null}
                <View style={{ padding: Space.lg, gap: 4 }}>
                  <T variant="label">{m.year}</T>
                  {m.text ? <T>{m.text}</T> : null}
                </View>
              </Card>
            </Pressable>
          ))}
          <T variant="small" muted style={{ textAlign: 'center' }}>
            Mantené apretado un recuerdo para borrarlo.
          </T>
        </View>
      )}

      <Sheet visible={open} onClose={cancel} title="Nuevo recuerdo">
        <Field label="Año" keyboardType="number-pad" maxLength={4} value={year} onChangeText={(v) => setYear(digitsOnly(v))} />
        <Field
          label="¿Qué pasó?"
          placeholder="Cena en casa, sorpresa con amigos…"
          value={text}
          onChangeText={setText}
          maxLength={LIMITS.memory}
          multiline
        />
        {photo ? <Image source={{ uri: photo }} style={{ height: 160, borderRadius: Radius.md }} contentFit="cover" /> : null}
        <Button
          label={photo ? 'Cambiar foto' : 'Agregar foto'}
          icon="image"
          variant="secondary"
          onPress={async () => {
            const uri = await pickPhoto();
            if (!uri) return;
            deletePhoto(photo); // la anterior ya no se usa
            setPhoto(uri);
          }}
        />
        <Button label="Guardar recuerdo" icon="check" onPress={save} />
      </Sheet>
    </Section>
  );
}

export default function EventDetailScreen() {
  const { c } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useStore((s) => s.events.find((e) => e.id === id));
  const tags = useStore((s) => s.tags);
  const templates = useStore((s) => s.templates);
  const settings = useStore((s) => s.settings);
  const toggleGreeted = useStore((s) => s.toggleGreeted);
  const [channel, setChannel] = useState<GreetChannel | null>(null);
  const [cardOpen, setCardOpen] = useState(false);

  if (!event) {
    return (
      <Screen>
        <Header />
        <EmptyState icon="question" title="No encontramos esta fecha" text="Puede que se haya borrado." />
      </Screen>
    );
  }

  const kind = getKind(event.kind);
  const up = upcomingOf(event);
  const eventTags = tags.filter((t) => event.tagIds.includes(t.id));
  const years = up?.years ?? null;
  const isToday = up?.days === 0;
  const todayKey = dateKey(new Date());
  const greeted = event.greetedOn.includes(todayKey);
  const zodiac = event.kind === 'birthday' && event.recurrence === 'yearly' ? zodiacSign(event.day, event.month) : null;

  const startGreet = (ch: GreetChannel) => {
    if (ch === 'call') {
      if (!event.phone) return Alert.alert('Sin teléfono', 'Agregá un teléfono editando esta fecha.');
      return greet('call', event.phone, '');
    }
    if (ch === 'sms' && !event.phone) return Alert.alert('Sin teléfono', 'Agregá un teléfono editando esta fecha.');
    setChannel(ch);
  };

  const sendWith = (text: string) => {
    if (!channel) return;
    const ch = channel;
    const message = text ? fillTemplate(text, event, years) : '';
    // Primero se cierra la hoja y después se abre la otra app: si Android cambia de app con la hoja
    // a medio cerrar, puede quedar una capa invisible que no deja tocar nada al volver.
    setChannel(null);
    setTimeout(() => greet(ch, event.phone, message), 350);
    if (isToday && !greeted) toggleGreeted(event.id, todayKey);
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <Header
          right={
            <IconButton
              icon="edit-2"
              label="Editar"
              onPress={() => router.push({ pathname: '/event/edit/[id]', params: { id: event.id } })}
            />
          }
        />

        <View style={styles.hero}>
          <Avatar event={event} size={96} />
          <T variant="display" style={{ textAlign: 'center' }}>
            {event.title}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={kind.icon} size={18} color={c.textMuted} />
            <T muted>
              {kind.label} · {formatEventDate(event)}
            </T>
          </View>
          {eventTags.length > 0 ? (
            <ChipRow>
              {eventTags.map((t) => (
                <Chip key={t.id} label={t.name} icon={t.icon} color={t.color} />
              ))}
            </ChipRow>
          ) : null}
        </View>

        <Card style={[styles.countdown, isToday && { backgroundColor: c.accentSoft, borderColor: 'transparent' }]}>
          {up ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Space.sm }}>
                {isToday ? <Icon name="party" size={24} /> : null}
                <T variant="title">{isToday ? '¡Es hoy!' : countdownLabel(up.days)}</T>
              </View>
              {years && kind.yearsLabel ? (
                <T muted style={{ textAlign: 'center' }}>
                  {kind.yearsLabel(years)}
                  {isMilestone(years) ? ' · ¡número redondo!' : ''}
                </T>
              ) : null}
            </>
          ) : (
            <T muted style={{ textAlign: 'center' }}>
              Esta fecha ya pasó.
            </T>
          )}
          {zodiac ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="moon" size={15} color={c.textMuted} />
              <T variant="small" muted>
                {zodiac.name}
              </T>
            </View>
          ) : null}
        </Card>

        {kind.person ? (
          <Section title="Saludar">
            <View style={{ flexDirection: 'row', gap: Space.sm }}>
              <GreetButton icon="message-circle" label="WhatsApp" onPress={() => startGreet('whatsapp')} />
              <GreetButton icon="message-square" label="SMS" onPress={() => startGreet('sms')} />
              <GreetButton icon="phone" label="Llamar" onPress={() => startGreet('call')} />
              <GreetButton icon="image" label="Tarjeta" onPress={() => setCardOpen(true)} />
            </View>
            {isToday ? (
              <Pressable
                onPress={() => {
                  tap();
                  toggleGreeted(event.id, todayKey);
                }}
                style={[styles.greetedRow, { backgroundColor: greeted ? c.successSoft : c.surface, borderColor: c.border }]}>
                <Feather name={greeted ? 'check-circle' : 'circle'} size={20} color={greeted ? c.success : c.textMuted} />
                <T style={{ fontFamily: Fonts.medium }}>{greeted ? '¡Ya saludaste!' : '¿Ya saludaste? Marcalo acá'}</T>
              </Pressable>
            ) : null}
          </Section>
        ) : null}

        {kind.person && event.likes ? (
          <Section title="Gustos">
            <Card>
              <T>{event.likes}</T>
            </Card>
          </Section>
        ) : null}

        {kind.person ? (
          <GiftsSection event={event} occurrenceYear={up?.date.getFullYear() ?? new Date().getFullYear()} />
        ) : null}

        {event.recurrence !== 'once' ? <MemoriesSection event={event} /> : null}

        {event.notes ? (
          <Section title="Notas">
            <Card>
              <T>{event.notes}</T>
            </Card>
          </Section>
        ) : null}

        <Section title="Avisos">
          <Card>
            <T variant="small" muted>
              {settings.notificationsEnabled
                ? `${offsetsSummary(effectiveOffsets(event, tags, settings))} · a las ${String(settings.notifyHour).padStart(2, '0')}:00`
                : 'Los avisos están desactivados en Ajustes.'}
            </T>
          </Card>
        </Section>
      </Screen>

      <Sheet visible={channel !== null} onClose={() => setChannel(null)} title="Elegí un mensaje">
        {templates.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => sendWith(t.text)}
            style={({ pressed }) => [styles.template, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}>
            <T>{fillTemplate(t.text, event, years)}</T>
          </Pressable>
        ))}
        <Button label="Escribir mi propio mensaje" variant="secondary" onPress={() => sendWith('')} />
      </Sheet>

      {kind.person ? (
        <ShareCardSheet event={event} years={years} visible={cardOpen} onClose={() => setCardOpen(false)} />
      ) : null}

      {isToday ? <Confetti /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Space.sm, marginBottom: Space.xl },
  countdown: { gap: 4, alignItems: 'center' },
  greetBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: Space.lg,
    borderRadius: Radius.md,
  },
  greetedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    padding: Space.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Space.md,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  template: { padding: Space.lg, borderRadius: Radius.md, borderWidth: 1 },
});
