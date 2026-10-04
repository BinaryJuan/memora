/**
 * Solo las partes de expo-notifications que usa Memora (avisos locales).
 *
 * No importar `expo-notifications` directo: su archivo principal registra al cargarse
 * un listener de notificaciones push, y en Expo Go para Android eso tira un error
 * (las push se sacaron de Expo Go en el SDK 53). Los avisos locales sí funcionan,
 * así que traemos cada módulo por separado.
 */
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponseAsync,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { setNotificationCategoryAsync } from 'expo-notifications/build/setNotificationCategoryAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
