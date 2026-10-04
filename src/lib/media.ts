import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Alert, Linking, Platform } from 'react-native';

import { newId } from '@/store/store';
import { dateKey } from './dates';
import type { BackupData, Settings } from './types';
import { BackupError, LIMITS, sanitizeBackup } from './validation';

/** Carpeta privada de la app donde se guardan las fotos de los recuerdos. */
export function photosDirUri(): string | null {
  if (Platform.OS === 'web') return null;
  return new Directory(Paths.document, 'fotos').uri;
}

/** Elige una foto de la galería y la copia a la carpeta de la app (la de la galería puede borrarse). */
export async function pickPhoto(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (res.canceled || !res.assets[0]) return null;
  const uri = res.assets[0].uri;
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'fotos');
    if (!dir.exists) dir.create();
    const dest = new File(dir, `${newId()}.jpg`);
    await new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

export function deletePhoto(uri?: string) {
  const dir = photosDirUri();
  // Solo borramos archivos de nuestra carpeta de fotos, nunca otra cosa.
  if (!uri || !dir || !uri.startsWith(dir) || uri.includes('..')) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // no pasa nada si ya no existe
  }
}

export async function exportBackup(data: Omit<BackupData, 'app' | 'version' | 'exportedAt'>) {
  const backup: BackupData = { app: 'memora', version: 1, exportedAt: new Date().toISOString(), ...data };
  const json = JSON.stringify(backup, null, 2);
  const name = `memora-respaldo-${dateKey(new Date())}.json`;

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('No se puede compartir', 'Este dispositivo no permite compartir archivos.');
      return;
    }
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Guardar respaldo de Memora' });
  } finally {
    // El archivo tiene datos personales: no lo dejamos tirado en la caché.
    try {
      file.delete();
    } catch {}
  }
}

/**
 * Abre el selector de archivos y devuelve el respaldo ya validado, o null si se canceló.
 * Si el archivo no sirve, tira BackupError con un mensaje para mostrar.
 */
export async function pickBackup(currentSettings: Settings): Promise<BackupData | null> {
  if (Platform.OS === 'web') {
    Alert.alert('No disponible', 'Importar respaldos funciona en el celular.');
    return null;
  }
  const res = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', '*/*'] });
  if (res.canceled) return null;
  const file = res.result;
  if ((file.size ?? 0) > LIMITS.backupBytes) throw new BackupError('El archivo es demasiado grande para ser un respaldo.');
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new BackupError('El archivo está dañado o no es un respaldo de Memora.');
  }
  return sanitizeBackup(raw, currentSettings, photosDirUri());
}

export type GreetChannel = 'whatsapp' | 'sms' | 'call';

function cleanPhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export async function greet(channel: GreetChannel, phone: string | undefined, message: string) {
  const p = phone ? cleanPhone(phone) : '';
  let url: string;
  if (channel === 'whatsapp') {
    const text = encodeURIComponent(message);
    url = p ? `https://wa.me/${p.replace('+', '')}?text=${text}` : `https://wa.me/?text=${text}`;
  } else if (channel === 'sms') {
    url = `sms:${p}?body=${encodeURIComponent(message)}`;
  } else {
    url = `tel:${p}`;
  }
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir', 'Revisá que la app esté instalada en el teléfono.');
  }
}
