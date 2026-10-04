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

## Próximo (pedido el 4/10/2026)
- 🐞 **El widget se ve transparente** en el Samsung (Android 16). Registrar la tarea antes de `expo-router/entry` no alcanzó. Próximo paso: celular por USB, agregar el widget y leer `adb logcat` (filtrar por `RNWidget`, `ReactNativeJS`, `AndroidRuntime`) para ver si la tarea corre, si falla el dibujo o si el ancho llega en 0. `adb` quedó en `../herramientas/platform-tools`.
- ⏳ "memora" en minúscula en el título del inicio (como en la animación de entrada y la tarjeta).
- ⏳ Idiomas: español e inglés como mínimo, según el idioma del teléfono y con opción en Ajustes. Implica sacar todos los textos a archivos de traducción (pantallas, avisos, widget, plantillas de saludo, nombres de meses y días, formatos de fecha) y traducir la ficha de Play Store. Evaluar portugués (Brasil es un mercado grande) en una segunda etapa.
- ⏳ Sección "Notas", al estilo Google Keep: notas sueltas (no atadas a una fecha), con título opcional, colores, fijar arriba, buscar y, quizás, listas con casillas. Va en la barra de abajo **en lugar de "Todas"**; la lista completa de fechas pasa a abrirse desde Inicio (un "Ver todas") o desde Calendario. Definir si entra en el respaldo (lo lógico es que sí).

## Más adelante
- ⏳ Pedir reseña en Play Store después de un tiempo de uso.
- ⏳ Repetición "cada semana".
- ⏳ Listas compartidas con familia o amigos. Necesita cuentas de usuario y un servidor.

## Descartado
- ❌ Respaldo automático en Google Drive: requiere registrar la app en Google Cloud, configurar OAuth y pasar la verificación de Google. No es fácil. Reemplazo: exportar el respaldo y elegir Drive en "Compartir".

## Limitaciones conocidas
- `npm audit` marca vulnerabilidades en herramientas de compilación de Expo (Metro, CLI). No llegan a la app instalada; se resuelven actualizando el SDK de Expo.
- Las fotos de los recuerdos no viajan en el respaldo (solo los datos).
