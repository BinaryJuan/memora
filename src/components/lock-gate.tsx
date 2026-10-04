import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { useStore } from '@/store/store';
import { Space, useTheme } from '@/theme/theme';
import { IconBadge } from './icon';
import { Button, T } from './ui';

export async function authenticate(reason: string): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancelar' });
    return res.success;
  } catch {
    return false;
  }
}

/** ¿El teléfono tiene algún bloqueo (huella, PIN, patrón)? */
async function deviceHasSecurity(): Promise<boolean> {
  try {
    return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

/** Si el bloqueo está activo, pide huella o PIN al abrir la app y al volver a ella. */
export function LockGate({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const enabled = useStore((s) => s.settings.lockEnabled) && Platform.OS !== 'web';
  const updateSettings = useStore((s) => s.updateSettings);
  const [locked, setLocked] = useState(enabled);
  const busy = useRef(false);

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      // Si el teléfono ya no tiene huella ni PIN, no hay forma de autenticar: apagamos el bloqueo
      // en vez de dejar a la persona afuera de sus propios datos.
      if (!(await deviceHasSecurity())) {
        updateSettings({ lockEnabled: false });
        setLocked(false);
        return;
      }
      if (await authenticate('Desbloquear Memora')) setLocked(false);
    } finally {
      busy.current = false;
    }
  }, [updateSettings]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      // Mientras se muestra el diálogo de huella la app pasa a "inactive": solo bloqueamos en "background".
      if (state === 'background') setLocked(true);
    });
    return () => sub.remove();
  }, [enabled]);

  // Con el bloqueo activo, Android no muestra el contenido en "apps recientes" ni permite capturas.
  useEffect(() => {
    if (!enabled) return;
    ScreenCapture.preventScreenCaptureAsync('lock').catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync('lock').catch(() => {});
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && locked) unlock();
  }, [enabled, locked, unlock]);

  const showLock = enabled && locked;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} importantForAccessibility={showLock ? 'no-hide-descendants' : 'auto'}>
        {children}
      </View>
      {showLock ? (
        <View style={[StyleSheet.absoluteFill, styles.lock, { backgroundColor: c.bg }]}>
          <IconBadge name="lock" size={88} style={{ marginBottom: Space.md }} />
          <T variant="display">Memora</T>
          <T muted style={{ textAlign: 'center' }}>
            Tus fechas están protegidas.
          </T>
          <Button label="Desbloquear" icon="unlock" onPress={unlock} style={{ marginTop: Space.lg }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lock: { alignItems: 'center', justifyContent: 'center', gap: Space.sm, padding: Space.xl },
});
