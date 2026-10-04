# Funcionalidades

Memora ya no es solo de cumpleaños: sirve para **cualquier fecha para acordarse**.
Cada fecha tiene un **tipo** (cumpleaños, aniversario, fecha especial, en memoria, recordatorio) y se repite **cada año, cada mes o una sola vez**.

Leyenda: ✅ hecho · 🚧 en curso · ⏳ más adelante · ❌ descartado

## Versión 1
- ✅ Agregar fecha: solo **nombre y fecha (día y mes)** son obligatorios. Opcionales: tipo, año, repetición, ícono, etiquetas, teléfono, gustos, notas. Un recordatorio "una vez" sin año toma la próxima vez que cae esa fecha.
- ✅ Ícono propio para cada fecha (en lugar de foto). Si no se elige: iniciales para personas o el ícono del tipo.
- ✅ Animación de entrada minimalista (contorno que se dibuja + destello + "memora"). Respeta "reducir movimiento".
- ✅ Etiquetas personalizables con color e ícono (Familia, Amigos, Trabajo, Pareja por defecto).
- ✅ Inicio con lo que viene: "Hoy", "Esta semana", "Este mes", "Más adelante", con "faltan X días".
- ✅ Calendario mensual con las fechas marcadas.
- ✅ Búsqueda y filtros por etiqueta y tipo.
- ✅ Años que cumple / que se cumplen.
- ✅ Avisos configurables (mismo día, 1 día, 3 días, 1 semana, 2 semanas, 1 mes antes): por defecto, por etiqueta o por fecha.
- ✅ Resumen semanal (los lunes).
- ✅ Ideas de regalo con presupuesto, historial de regalos dados y ficha de gustos.
- ✅ Saludar por WhatsApp, llamada o SMS con plantillas de mensaje editables.
- ✅ Checklist "¿Ya saludaste?" del día.
- ✅ Importar cumpleaños y aniversarios desde los contactos.
- ✅ Exportar e importar respaldo (archivo JSON). Al exportar se abre "Compartir", desde donde se puede guardar en Google Drive.
- ✅ Recuerdos por año (texto y foto).
- ✅ Fechas especiales destacadas (18, 30, 50...).
- ✅ Signo del zodíaco.
- ✅ Estadísticas.
- ✅ Confeti el día de la fecha.
- ✅ Modo oscuro (sistema, claro u oscuro).
- ✅ Bloqueo con huella o PIN del teléfono.

- ✅ Bienvenida de 3 pasos que explica la app y pide el permiso de avisos con contexto.
- ✅ Botón "Saludar por WhatsApp" dentro del aviso del día.
- ✅ Tarjeta para compartir (imagen 4:5) en terracota, salvia o arena.
- ✅ "Deshacer" al borrar fechas, recuerdos e ideas de regalo.
- ✅ Widget "Próximas fechas" para la pantalla de inicio. Solo en la app compilada (en Expo Go no existe).

## Versión 1.1 (4/10/2026)
- ✅ "memora" en minúscula en el inicio y en el bloqueo, igual que en la animación y la tarjeta.
- ✅ **Idiomas: español e inglés.** Por defecto sigue el idioma del teléfono (español si está en español, inglés para cualquier otro); se puede elegir en Ajustes. Todo está traducido: pantallas, avisos, widget, formatos de fecha (en inglés la semana empieza el domingo), signos y mensajes de saludo. Las etiquetas y mensajes de fábrica se traducen solos al cambiar de idioma, salvo que se hayan editado. Los textos están en `src/i18n/es.ts` y `src/i18n/en.ts` (una prueba verifica que tengan las mismas claves).
- ✅ **Notas**, al estilo Keep: pestaña propia en lugar de "Todas". Título y texto, color, fijar arriba, búsqueda, grilla de dos columnas. Se guardan solas al escribir; una nota vacía no se guarda. Borrar tiene "Deshacer". Entran en el respaldo.
- ✅ "Todas las fechas" se abre desde Inicio (botón arriba a la derecha y "Ver todas las fechas" al final).
- ✅ **Sonido los días de cumple**: al abrir la app, si hay algún cumpleaños hoy, suena un "ding-ding" corto. Una vez por día, nunca con el teléfono en silencio o vibración, sin cortar la música. Se apaga en Ajustes. El sonido está en `assets/sounds/cumple.wav` (lo genera `scripts/generar-sonido.js`; se puede reemplazar por otro archivo con el mismo nombre).

## Próximo
- 🐞 **El widget se ve transparente** en el Samsung (Android 16). Registrar la tarea antes de `expo-router/entry` no alcanzó. Próximo paso: celular por USB, agregar el widget y leer `adb logcat` (filtrar por `RNWidget`, `ReactNativeJS`, `AndroidRuntime`) para ver si la tarea corre, si falla el dibujo o si el ancho llega en 0. `adb` quedó en `../herramientas/platform-tools`.
- ⏳ Portugués (Brasil es un mercado grande): alcanza con sumar `src/i18n/pt.ts` y agregarlo en `core.ts`.
- ⏳ Notas con listas de casillas (como las de Keep).

## Más adelante
- ⏳ Pedir reseña en Play Store después de un tiempo de uso.
- ⏳ Repetición "cada semana".
- ⏳ Listas compartidas con familia o amigos. Necesita cuentas de usuario y un servidor.

## Descartado
- ❌ Respaldo automático en Google Drive: requiere registrar la app en Google Cloud, configurar OAuth y pasar la verificación de Google. No es fácil. Reemplazo: exportar el respaldo y elegir Drive en "Compartir".

## Limitaciones conocidas
- `npm audit` marca vulnerabilidades en herramientas de compilación de Expo (Metro, CLI). No llegan a la app instalada; se resuelven actualizando el SDK de Expo.
- Las fotos de los recuerdos no viajan en el respaldo (solo los datos).
