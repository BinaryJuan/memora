import 'expo-router/entry';

import { registerWidget } from '@/widget';

// El widget de la pantalla de inicio corre aunque la app esté cerrada: se registra al arrancar.
registerWidget();
