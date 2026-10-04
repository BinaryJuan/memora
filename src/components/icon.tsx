import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { tint, useTheme } from '@/theme/theme';
import { ICONS, type Fill, type IconKey, type Shape } from './icon-data';

export { EVENT_ICONS, isIconKey, TAG_ICONS, type IconKey } from './icon-data';

export function Icon({
  name,
  size = 24,
  color,
  accent,
}: {
  name: IconKey;
  size?: number;
  /** Color del trazo. */
  color?: string;
  /** Color del relleno suave. */
  accent?: string;
}) {
  const { c } = useTheme();
  const stroke = color ?? c.text;
  const soft = accent ?? c.accent;
  const fillOf = (f: Fill) => (f === 't' ? soft : f === 's' ? stroke : 'none');
  const fillOpacity = (f: Fill) => (f === 't' ? 0.38 : 1);
  const common = { stroke, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {(ICONS[name] as Shape[]).map((s, i) => {
        switch (s[0]) {
          case 'p':
            return <Path key={i} d={s[1]} {...common} fill={fillOf(s[2])} fillOpacity={fillOpacity(s[2])} />;
          case 'c':
            return (
              <Circle key={i} cx={s[1]} cy={s[2]} r={s[3]} {...common} fill={fillOf(s[4])} fillOpacity={fillOpacity(s[4])} />
            );
          case 'r':
            return (
              <Rect
                key={i}
                x={s[1]}
                y={s[2]}
                width={s[3]}
                height={s[4]}
                rx={s[5]}
                {...common}
                fill={fillOf(s[6])}
                fillOpacity={fillOpacity(s[6])}
              />
            );
          case 'e':
            return (
              <Ellipse key={i} cx={s[1]} cy={s[2]} rx={s[3]} ry={s[4]} {...common} fill={fillOf(s[5])} fillOpacity={fillOpacity(s[5])} />
            );
        }
      })}
    </Svg>
  );
}

/** Forma orgánica (tipo piedrita) como fondo de un ícono. */
export function blobRadius(size: number) {
  return {
    borderTopLeftRadius: size * 0.52,
    borderTopRightRadius: size * 0.42,
    borderBottomRightRadius: size * 0.56,
    borderBottomLeftRadius: size * 0.38,
  };
}

export function IconBadge({
  name,
  size = 40,
  color,
  style,
}: {
  name: IconKey;
  size?: number;
  /** Color base: tiñe el fondo y el relleno del ícono. */
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const base = color ?? c.accent;
  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(base, 0.16) },
        blobRadius(size),
        style,
      ]}>
      <Icon name={name} size={size * 0.56} accent={base} />
    </View>
  );
}
