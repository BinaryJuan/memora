import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#C98A6B', '#94A684', '#8EA2B0', '#CFA45C', '#B596A3', '#CC9A8C'];
const PIECES = 46;

/** Lluvia de confeti que cae una sola vez. No bloquea los toques. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));

  const [pieces] = useState(() =>
      Array.from({ length: PIECES }, (_, i) => ({
        key: i,
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.35,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        round: Math.random() > 0.6,
      })),
  );

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => {
        const local = progress.interpolate({
          inputRange: [0, p.delay, 1],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={p.key}
            style={{
              position: 'absolute',
              left: p.x,
              top: -20,
              width: p.size,
              height: p.round ? p.size : p.size * 1.6,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity: local.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateY: local.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.9] }) },
                { translateX: local.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
                { rotate: local.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
