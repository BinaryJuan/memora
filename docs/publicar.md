# Publicar en Google Play

Pasos en orden. Lo marcado con ⚠️ hay que decidirlo antes del primer build, porque después no se puede cambiar.

## 1. Antes de compilar

- ✅ **Nombre del paquete:** `ar.com.memora.fechas` (en `app.json`). Verificado libre en Play Store el 3/10/2026. No se puede cambiar después de publicar.
- **Nombre en la tienda:** "Memora" puede chocar con otras apps. Buscalo en Play Store; si hace falta, algo como "Memora: cumpleaños y fechas".
- **Política de privacidad publicada en una URL.** Está en [politica-de-privacidad.md](politica-de-privacidad.md). Ya está publicada como página (ver abajo); en Play Console pegá su link. Si la querés en otro lado, también está en HTML: [politica-de-privacidad.html](politica-de-privacidad.html). Play la exige porque la app lee contactos.

## 2. Cuenta de desarrollador

- Crear la cuenta en [Play Console](https://play.google.com/console). Hoy cuesta USD 25, un único pago.
- Si es una cuenta personal nueva, Google pide una **prueba cerrada con al menos 12 personas durante 14 días** antes de poder publicar para todos. Conviene arrancar eso cuanto antes (familia y amigos sirven).

## 3. Compilar con EAS

EAS compila en la nube; no hace falta Android Studio.

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

Para probar en tu celular una versión real (con avisos, sin Expo Go):

```bash
npx eas-cli@latest build -p android --profile preview
```

Te da un link para bajar un `.apk` e instalarlo.

Para la tienda:

```bash
npx eas-cli@latest build -p android --profile production
```

Genera el `.aab` que se sube a Play. EAS crea y guarda la clave de firma; **no la pierdas**: sin ella no podés publicar actualizaciones. Con `npx eas-cli credentials` podés bajar una copia.

La primera vez, el `.aab` se sube a mano en Play Console. Después se puede automatizar con `eas submit`.

## 4. Ficha de la tienda

- **Ícono 512×512:** [`store-assets/icono-512.png`](../store-assets/icono-512.png).
- **Imagen destacada 1024×500:** [`store-assets/imagen-destacada-1024x500.png`](../store-assets/imagen-destacada-1024x500.png).
- **Capturas:** 6 listas en [`store-assets/capturas/`](../store-assets/capturas/) (1080×1920, con título). Las originales sin título están en `store-assets/raw/`.
- **Descripción corta** (80 caracteres como máximo):
  > Cumpleaños, aniversarios y fechas importantes, con avisos a tiempo.
- **Descripción larga** (borrador):
  > Memora te ayuda a no olvidarte de las fechas que importan.
  >
  > Anotá cumpleaños, aniversarios o cualquier cosa que tengas que recordar, y Memora te avisa el mismo día, unos días antes o cuando vos quieras. Los lunes te cuenta lo que viene en la semana.
  >
  > • Etiquetas para ordenar a tu gente: familia, amigos, trabajo.
  > • Ideas de regalo, lo que ya regalaste y los gustos de cada persona.
  > • Saludá por WhatsApp o SMS con un toque.
  > • Guardá un recuerdo de cada año, con foto.
  > • Calendario, búsqueda y estadísticas.
  > • Modo oscuro y bloqueo con huella.
  >
  > Tus datos quedan en tu teléfono: sin cuentas, sin publicidad, sin vueltas. Si querés, exportás un respaldo y lo guardás donde prefieras.

## 5. Formularios de Play Console

- **Seguridad de los datos:** la app **no recolecta ni comparte datos** (nada sale del teléfono). Marcá que no recolecta datos.
- **Permisos:** la app pide notificaciones, alarmas exactas ("Alarmas y recordatorios", para que los avisos no se atrasen; la persona lo activa), contactos (solo lectura), huella y vibración. Los demás que traían las librerías (cámara, micrófono, almacenamiento, escribir contactos) están bloqueados en `app.json`.
- **Clasificación de contenido:** completar el cuestionario; no tiene contenido sensible.
- **Público objetivo:** mayores de 13 años. Si marcás menores, aplican las reglas de apps para familias, que son mucho más estrictas.
- **Anuncios:** no tiene.

## 6. Antes de cada versión nueva

```bash
npm run typecheck && npm run lint && npm test
```

Probar en la versión `preview`: crear una fecha, recibir un aviso, exportar e importar un respaldo, activar y desactivar el bloqueo.

`version` en `app.json` es lo que ve la gente (1.0.0, 1.1.0…). El número interno de versión lo sube EAS solo.
