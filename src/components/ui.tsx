import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, Space, tint, useTheme } from '@/theme/theme';
import { blobRadius, Icon, IconBadge, type IconKey } from './icon';

export type IconName = ComponentProps<typeof Feather>['name'];

export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/* ---------- Texto ---------- */

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label';

const variantStyle: Record<Variant, object> = {
  display: { fontFamily: Fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  title: { fontFamily: Fonts.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  heading: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
};

export function T({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string }) {
  const { c } = useTheme();
  const defaultColor = muted || variant === 'label' ? c.textMuted : c.text;
  return <Text {...rest} style={[variantStyle[variant], { color: color ?? defaultColor }, style]} />;
}

/* ---------- Estructura ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
}) {
  const { c } = useTheme();
  // Abajo puede estar la barra de navegación del sistema (la app se dibuja de borde a borde).
  const { bottom } = useSafeAreaInsets();
  const pad = padded ? { paddingHorizontal: Space.lg } : null;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[pad, { paddingBottom: 120 + (footer ? 0 : bottom) }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, pad]}>{children}</View>
        )}
        {footer ? <View style={{ paddingBottom: bottom, backgroundColor: c.bg }}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Encabezado de pantallas secundarias: volver + título + acción. */
export function Header({ title, right }: { title?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <IconButton icon="arrow-left" label="Volver" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <T variant="heading" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
        {title ?? ''}
      </T>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

/** Título grande de las pestañas principales. */
export function PageTitle({ title, kicker, right }: { title: string; kicker?: string; right?: ReactNode }) {
  return (
    <View style={styles.pageTitle}>
      <View style={{ flex: 1 }}>
        {kicker ? <T variant="label">{kicker}</T> : null}
        <T variant="display">{title}</T>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, style]}>{children}</View>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ marginTop: Space.xl }}>
      <View style={styles.sectionHead}>
        <T variant="label">{title}</T>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

/* ---------- Botones ---------- */

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
  small,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const { c } = useTheme();
  const bg = { primary: c.accent, secondary: c.surfaceAlt, ghost: 'transparent', danger: tint(c.danger, 0.12) }[variant];
  const fg = { primary: c.onAccent, secondary: c.text, ghost: c.accent, danger: c.danger }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        icon && (small ? styles.buttonSmallWithIcon : styles.buttonWithIcon),
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
        style,
      ]}>
      {icon ? <Feather name={icon} size={small ? 15 : 18} color={fg} /> : null}
      <Text style={[styles.centered, { fontFamily: Fonts.bold, fontSize: small ? 13 : 15, lineHeight: small ? 17 : 20, color: fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  filled,
  label,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  /** Lo que lee el lector de pantalla: obligatorio porque el botón es solo un ícono. */
  label: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: filled ? c.surfaceAlt : 'transparent', opacity: pressed ? 0.6 : 1 },
      ]}>
      <Feather name={icon} size={20} color={color ?? c.text} />
    </Pressable>
  );
}

export function Fab({ onPress, label = 'Agregar' }: { onPress: () => void; label?: string }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.fab, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
      <Feather name="plus" size={22} color={c.onAccent} />
      <Text style={[styles.centered, { fontFamily: Fonts.bold, fontSize: 15, lineHeight: 20, color: c.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- Selección ---------- */

export function Chip({
  label,
  icon,
  color,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  icon?: IconKey;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const { c } = useTheme();
  const base = color ?? c.accent;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      onPress={
        onPress
          ? () => {
              tap();
              onPress();
            }
          : undefined
      }
      onLongPress={onLongPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: tint(base, 0.22), borderColor: tint(base, 0.7) }
          : { backgroundColor: color ? tint(base, 0.12) : c.surface, borderColor: color ? 'transparent' : c.border },
      ]}>
      {icon ? <Icon name={icon} size={16} accent={base} /> : null}
      <Text style={[styles.centered, { fontFamily: selected ? Fonts.bold : Fonts.medium, fontSize: 13, color: c.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Space.sm, paddingVertical: 2 }}
        style={{ flexGrow: 0 }}>
        {children}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm }}>{children}</View>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              tap();
              onChange(o.id);
            }}
            style={[styles.segment, active && { backgroundColor: c.surface }]}>
            <Text
              style={[
                styles.centered,
                { fontFamily: active ? Fonts.bold : Fonts.medium, fontSize: 13, color: active ? c.text : c.textMuted },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Formularios ---------- */

export function Field({ label, hint, style, ...rest }: TextInputProps & { label?: string; hint?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <T variant="small" style={{ fontFamily: Fonts.medium }}>{label}</T> : null}
      <TextInput
        placeholderTextColor={c.textMuted}
        {...rest}
        style={[
          styles.input,
          { backgroundColor: c.surface, borderColor: c.border, color: c.text },
          rest.multiline && { minHeight: 90, textAlignVertical: 'top', paddingTop: 12 },
          style,
        ]}
      />
      {hint ? <T variant="small" muted>{hint}</T> : null}
    </View>
  );
}

export function Row({
  icon,
  badge,
  title,
  subtitle,
  onPress,
  right,
  danger,
}: {
  icon?: IconName;
  /** Ícono propio sobre una piedrita de color. */
  badge?: { icon: IconKey; color: string };
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      {icon ? (
        <View style={[styles.rowIcon, blobRadius(36), { backgroundColor: c.surfaceAlt }]}>
          <Feather name={icon} size={17} color={danger ? c.danger : c.text} />
        </View>
      ) : null}
      {badge ? <IconBadge name={badge.icon} color={badge.color} size={38} /> : null}
      <View style={{ flex: 1 }}>
        <T style={{ fontFamily: Fonts.medium }} color={danger ? c.danger : undefined}>
          {title}
        </T>
        {subtitle ? <T variant="small" muted>{subtitle}</T> : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={c.textMuted} /> : null)}
    </Pressable>
  );
}

export function SwitchRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { c } = useTheme();
  return (
    <Row
      icon={icon}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          value={value}
          onValueChange={(v) => {
            tap();
            onChange(v);
          }}
          trackColor={{ true: c.success, false: c.border }}
          thumbColor={c.surface}
          // @ts-expect-error: prop solo de react-native-web
          activeThumbColor={c.surface}
        />
      }
    />
  );
}

export function EmptyState({
  icon,
  title,
  text,
  children,
}: {
  icon: IconKey;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <IconBadge name={icon} size={84} style={{ marginBottom: Space.sm }} />
      <T variant="title" style={{ textAlign: 'center' }}>
        {title}
      </T>
      {text ? (
        <T muted style={{ textAlign: 'center', maxWidth: 300 }}>
          {text}
        </T>
      ) : null}
      {children ? <View style={{ gap: Space.sm, marginTop: Space.md, alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  );
}

/** Hoja que sube desde abajo. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.bg, paddingBottom: insets.bottom + Space.lg }]}>
          <View style={[styles.grabber, { backgroundColor: c.border }]} />
          <View style={styles.sheetHead}>
            <T variant="title" style={{ flex: 1 }}>
              {title}
            </T>
            <IconButton icon="x" onPress={onClose} filled label="Cerrar" />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Space.md }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: Space.sm,
    marginBottom: Space.sm,
  },
  pageTitle: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: Space.xl,
    paddingBottom: Space.lg,
    gap: Space.md,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Space.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Space.sm,
    minHeight: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Space.sm,
    borderRadius: Radius.pill,
    paddingHorizontal: Space.xl,
    paddingVertical: 14,
  },
  buttonSmall: { paddingHorizontal: Space.lg, paddingVertical: 9 },
  // El ícono trae aire propio a los costados: con un poco menos de margen a la izquierda,
  // ícono y texto quedan centrados a la vista.
  buttonWithIcon: { paddingLeft: Space.xl - 3 },
  buttonSmallWithIcon: { paddingLeft: Space.lg - 2 },
  // Android suma un margen arriba de las letras: sin él, el texto queda centrado de verdad.
  centered: { includeFontPadding: false, textAlignVertical: 'center' },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    paddingLeft: 19,
    paddingRight: 22,
    paddingVertical: 16,
    borderRadius: Radius.pill,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Space.lg,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    paddingVertical: Space.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Space.sm,
    paddingVertical: Space.xxl,
    paddingHorizontal: Space.lg,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Space.lg,
    maxHeight: '85%',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: Space.sm },
  sheetHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: Space.md },
});
