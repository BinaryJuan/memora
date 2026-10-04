import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '@/i18n/core';
import { capitalize, clampDate, isValidDate, monthName, monthNames, startOfDay } from '@/lib/dates';
import { askExactAlarmsOnce, ensurePermission } from '@/lib/notifications';
import { getKind, kinds, offsetsSummary, recurrences } from '@/lib/kinds';
import type { KindId, MemoraEvent, Recurrence } from '@/lib/types';
import { digitsOnly, isValidPhone, LIMITS, MAX_YEAR, MIN_YEAR } from '@/lib/validation';
import { useStore, type NewEvent } from '@/store/store';
import { Fonts, Radius, Space, useTheme } from '@/theme/theme';
import { Avatar } from './event-row';
import { blobRadius, EVENT_ICONS, Icon, type IconKey } from './icon';
import { OffsetPicker } from './offset-picker';
import { Button, Card, Chip, ChipRow, Field, Section, Segmented, Sheet, SwitchRow, T, tap } from './ui';

interface Props {
  initial?: MemoraEvent;
  defaults?: { day?: number; month?: number };
  onSaved: (id: string) => void;
}

export function EventForm({ initial, defaults, onSaved }: Props) {
  const { c } = useTheme();
  const tags = useStore((s) => s.tags);
  const settings = useStore((s) => s.settings);
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);

  const [kind, setKind] = useState<KindId>(initial?.kind ?? 'birthday');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [day, setDay] = useState(String(initial?.day ?? defaults?.day ?? ''));
  const [month, setMonth] = useState<number | null>(initial?.month ?? defaults?.month ?? null);
  const [year, setYear] = useState(initial?.year ? String(initial.year) : '');
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? 'yearly');
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [icon, setIcon] = useState<IconKey | undefined>(initial?.icon);
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [likes, setLikes] = useState(initial?.likes ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [customReminders, setCustomReminders] = useState(!!initial?.reminderOffsets);
  const [offsets, setOffsets] = useState<number[]>(initial?.reminderOffsets ?? settings.defaultOffsets);
  const [monthSheet, setMonthSheet] = useState(false);
  const [iconSheet, setIconSheet] = useState(false);

  const info = getKind(kind);
  const f = strings().form;

  const changeKind = (k: KindId) => {
    setKind(k);
    if (!initial) setRecurrence(getKind(k).defaultRecurrence);
  };

  // Solo el nombre y la fecha (día y mes) son obligatorios.
  const save = async () => {
    const d = parseInt(day, 10);
    let y = recurrence !== 'monthly' && year.trim() ? parseInt(year, 10) : undefined;
    const m = recurrence === 'monthly' ? (month ?? 1) : month;
    if (!title.trim()) return Alert.alert(f.missingName, info.titleLabel);
    if (!day.trim() || (recurrence !== 'monthly' && !m))
      return Alert.alert(f.missingDate, recurrence === 'monthly' ? f.missingDayOfMonth : f.missingDayMonth);
    if (!m) return;
    if (y !== undefined && (Number.isNaN(y) || y < MIN_YEAR || y > MAX_YEAR)) return Alert.alert(f.badYear, f.badYearText);
    if (info.person && phone.trim() && !isValidPhone(phone.trim())) return Alert.alert(f.badPhone, f.badPhoneText);
    if (recurrence === 'monthly' ? !(d >= 1 && d <= 31) : !isValidDate(d, m, y)) return Alert.alert(f.badDate, f.badDateText);
    // Una sola vez y sin año: la próxima vez que caiga esa fecha.
    if (recurrence === 'once' && !y) {
      const thisYear = new Date().getFullYear();
      y = clampDate(thisYear, m, d) >= startOfDay(new Date()) ? thisYear : thisYear + 1;
    }

    const data: NewEvent = {
      title: title.trim(),
      kind,
      day: d,
      month: m,
      year: y,
      recurrence,
      tagIds,
      icon,
      phone: info.person && phone.trim() ? phone.trim() : undefined,
      likes: info.person && likes.trim() ? likes.trim() : undefined,
      notes: notes.trim() || undefined,
      reminderOffsets: customReminders ? offsets : undefined,
    };

    let id: string;
    if (initial) {
      updateEvent(initial.id, data);
      id = initial.id;
    } else {
      id = addEvent(data);
    }
    // La primera vez que se guarda algo pedimos permiso para avisar
    // y, si Android lo pide, permiso para que los avisos lleguen a horario.
    if (settings.notificationsEnabled && (await ensurePermission().catch(() => false))) await askExactAlarmsOnce();
    onSaved(id);
  };

  return (
    <View>
      <Section title={f.type}>
        <ChipRow scroll>
          {kinds().map((k) => (
            <Chip key={k.id} label={k.label} icon={k.icon} selected={kind === k.id} onPress={() => changeKind(k.id)} />
          ))}
        </ChipRow>
      </Section>

      <View style={{ marginTop: Space.xl, flexDirection: 'row', gap: Space.lg, alignItems: 'flex-end' }}>
        <Pressable onPress={() => setIconSheet(true)} accessibilityLabel={f.chooseIcon}>
          <Avatar event={{ kind, title, tagIds }} icon={icon} size={72} />
          <View style={[styles.editBadge, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Feather name="edit-2" size={12} color={c.text} />
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Field
            label={info.titleLabel}
            placeholder={info.titlePlaceholder}
            value={title}
            onChangeText={setTitle}
            autoCapitalize="words"
            maxLength={LIMITS.title}
            autoFocus={!initial}
          />
        </View>
      </View>

      <Section title={f.date}>
        <View style={{ gap: Space.md }}>
          <Segmented options={recurrences()} value={recurrence} onChange={setRecurrence} />
          <View style={{ flexDirection: 'row', gap: Space.sm }}>
            <View style={{ width: 80 }}>
              <Field
                label={f.day}
                placeholder="15"
                keyboardType="number-pad"
                maxLength={2}
                value={day}
                onChangeText={(v) => setDay(digitsOnly(v))}
              />
            </View>
            {recurrence !== 'monthly' ? (
              <View style={{ flex: 1, gap: 6 }}>
                <T variant="small" style={{ fontFamily: Fonts.medium }}>
                  {f.month}
                </T>
                <Pressable
                  onPress={() => setMonthSheet(true)}
                  style={[styles.select, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 15, color: month ? c.text : c.textMuted }}>
                    {month ? capitalize(monthName(month)) : f.choose}
                  </Text>
                  <Feather name="chevron-down" size={18} color={c.textMuted} />
                </Pressable>
              </View>
            ) : null}
            {recurrence !== 'monthly' ? (
              <View style={{ width: 96 }}>
                <Field
                  label={f.yearOptional}
                  placeholder="1990"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={year}
                  onChangeText={(v) => setYear(digitsOnly(v))}
                />
              </View>
            ) : null}
          </View>
          {recurrence === 'yearly' && info.yearsLabel ? (
            <T variant="small" muted>
              {kind === 'birthday' ? f.yearsHintBirthday : f.yearsHint}
            </T>
          ) : null}
        </View>
      </Section>

      {tags.length > 0 ? (
        <Section
          title={f.tags}
          action={
            <Pressable onPress={() => router.push('/tags')}>
              <T variant="small" color={c.accent} style={{ fontFamily: Fonts.bold }}>
                {strings().common.edit}
              </T>
            </Pressable>
          }>
          <ChipRow>
            {tags.map((t) => {
              const on = tagIds.includes(t.id);
              return (
                <Chip
                  key={t.id}
                  label={t.name}
                  icon={t.icon}
                  color={t.color}
                  selected={on}
                  onPress={() => setTagIds(on ? tagIds.filter((x) => x !== t.id) : [...tagIds, t.id])}
                />
              );
            })}
          </ChipRow>
        </Section>
      ) : null}

      {info.person ? (
        <Section title={f.contact}>
          <View style={{ gap: Space.md }}>
            <Field
              label={f.phone}
              placeholder={f.phonePlaceholder}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={LIMITS.phone}
              hint={f.phoneHint}
            />
            <Field
              label={f.likes}
              placeholder={f.likesPlaceholder}
              value={likes}
              onChangeText={setLikes}
              maxLength={LIMITS.likes}
              multiline
            />
          </View>
        </Section>
      ) : null}

      <Section title={f.notes}>
        <Field
          placeholder={f.notesPlaceholder}
          value={notes}
          onChangeText={setNotes}
          maxLength={LIMITS.notes}
          multiline
        />
      </Section>

      <Section title={f.reminders}>
        <Card style={{ paddingVertical: Space.xs }}>
          <SwitchRow
            icon="bell"
            title={f.customReminders}
            subtitle={customReminders ? f.customOnly : f.byDefault(offsetsSummary(settings.defaultOffsets))}
            value={customReminders}
            onChange={setCustomReminders}
          />
          {customReminders ? (
            <View style={{ paddingBottom: Space.md }}>
              <OffsetPicker value={offsets} onChange={setOffsets} />
            </View>
          ) : null}
        </Card>
      </Section>

      <Button label={initial ? f.saveChanges : strings().common.save} icon="check" onPress={save} style={{ marginTop: Space.xxl }} />

      <Sheet visible={iconSheet} onClose={() => setIconSheet(false)} title={f.icon}>
        <View style={styles.iconGrid}>
          <Pressable
            accessibilityLabel={f.auto}
            onPress={() => {
              tap();
              setIcon(undefined);
              setIconSheet(false);
            }}
            style={[styles.iconCell, blobRadius(56), { backgroundColor: !icon ? c.accentSoft : c.surface, borderColor: !icon ? c.accent : c.border }]}>
            <Text style={{ fontFamily: Fonts.bold, fontSize: 13, color: c.text }}>{info.person ? f.autoShortPerson : f.autoShort}</Text>
          </Pressable>
          {EVENT_ICONS.map((k) => (
            <Pressable
              key={k}
              accessibilityLabel={k}
              onPress={() => {
                tap();
                setIcon(k);
                setIconSheet(false);
              }}
              style={[styles.iconCell, blobRadius(56), { backgroundColor: icon === k ? c.accentSoft : c.surface, borderColor: icon === k ? c.accent : c.border }]}>
              <Icon name={k} size={26} />
            </Pressable>
          ))}
        </View>
        <T variant="small" muted>
          {info.person ? f.autoHintPerson : f.autoHint}
        </T>
      </Sheet>

      <Sheet visible={monthSheet} onClose={() => setMonthSheet(false)} title={f.month}>
        <View style={styles.monthGrid}>
          {monthNames().map((name, i) => {
            const active = month === i + 1;
            return (
              <Pressable
                key={name}
                onPress={() => {
                  tap();
                  setMonth(i + 1);
                  setMonthSheet(false);
                }}
                style={[
                  styles.monthCell,
                  { backgroundColor: active ? c.accent : c.surface, borderColor: active ? c.accent : c.border },
                ]}>
                <Text style={{ fontFamily: Fonts.medium, fontSize: 14, color: active ? c.onAccent : c.text }}>
                  {capitalize(name)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  iconCell: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  select: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  monthCell: {
    width: '31.5%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
