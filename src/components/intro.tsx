import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Fonts, useTheme } from '@/theme/theme';

// En web, react-native-svg animado tira un aviso de React: ahí el contorno aparece ya dibujado.
const AnimatedPath = Platform.OS === 'web' ? null : Animated.createAnimatedComponent(Path);

/** Piedrita orgánica (misma forma que los avatares) en una grilla de 120×120. */
const BLOB = 'M60 14c20 0 38 13 42 32s-6 40-24 50-42 8-56-6S8 52 18 34 40 14 60 14z';
/** Largo aproximado del contorno: alcanza con que sea un poco mayor al real. */
const BLOB_LENGTH = 320;
const SPARKLE = 'M60 44c1.6 10.5 5.5 14.4 16 16-10.5 1.6-14.4 5.5-16 16-1.6-10.5-5.5-14.4-16-16 10.5-1.6 14.4-5.5 16-16z';
const SIZE = 120;

/**
 * Animación de entrada: el contorno se dibuja solo, aparece un destello en el medio
 * y la palabra "memora". Después se desvanece. Respeta "reducir movimiento" del sistema.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const { c } = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let cancelled = false;
    const fadeOut = (delay: number) =>
      Animated.timing(fade, { toValue: 0, duration: 450, delay, easing: Easing.out(Easing.quad), useNativeDriver: false });

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          progress.setValue(1);
          fadeOut(400).start(() => onDone());
          return;
        }
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 1,
            duration: 1700,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
          fadeOut(250),
        ]).start(() => onDone());
      });
    return () => {
      cancelled = true;
    };
  }, [progress, fade, onDone]);

  const dashOffset = progress.interpolate({ inputRange: [0, 0.6], outputRange: [BLOB_LENGTH, 0], extrapolate: 'clamp' });
  const sparkleOpacity = progress.interpolate({ inputRange: [0.45, 0.75], outputRange: [0, 1], extrapolate: 'clamp' });
  const sparkleScale = progress.interpolate({ inputRange: [0.45, 0.85], outputRange: [0.5, 1], extrapolate: 'clamp' });
  const textOpacity = progress.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const textShift = progress.interpolate({ inputRange: [0.6, 1], outputRange: [8, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.wrap, { backgroundColor: c.bg, opacity: fade }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE} viewBox="0 0 120 120">
          {AnimatedPath ? (
            <AnimatedPath
              d={BLOB}
              fill="none"
              stroke={c.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray={`${BLOB_LENGTH} ${BLOB_LENGTH}`}
              strokeDashoffset={dashOffset}
            />
          ) : (
            <Path d={BLOB} fill="none" stroke={c.accent} strokeWidth={2} strokeLinecap="round" />
          )}
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] }]}>
          <Svg width={SIZE} height={SIZE} viewBox="0 0 120 120">
            <Path d={SPARKLE} fill={c.accent} fillOpacity={0.35} stroke={c.text} strokeWidth={1.6} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      </View>
      <Animated.Text
        style={[
          styles.word,
          { color: c.text, opacity: textOpacity, transform: [{ translateY: textShift }] },
        ]}>
        memora
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  word: { fontFamily: Fonts.bold, fontSize: 20, letterSpacing: 3, marginTop: 18 },
});
