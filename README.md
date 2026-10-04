# Memora

App para Android que te ayuda a acordarte de las fechas que importan: cumpleaños, aniversarios, fechas especiales o cualquier cosa que no te quieras olvidar.

Todo queda guardado en el teléfono. No hay cuentas, servidores ni publicidad.

## Qué hace

- Anotás una fecha con nombre y día; todo lo demás es opcional.
- Te avisa el mismo día, unos días antes o cuando vos elijas, y los lunes te manda un resumen de la semana.
- Etiquetas (familia, amigos, trabajo…), calendario y búsqueda.
- Ideas de regalo, lo que ya regalaste y los gustos de cada persona.
- Saludar por WhatsApp o SMS con mensajes armados.
- Recuerdos de cada año, con foto.
- Respaldo en un archivo, que podés guardar en Drive o donde quieras.
- Bloqueo con huella o PIN.

## Para desarrollar

Hecha con Expo (SDK 57), React Native y TypeScript.

```bash
npm install
npx expo start
```

Escaneá el QR con Expo Go desde el celular. Para la vista en el navegador: `npx expo start --web`.

Antes de subir cambios:

```bash
npm run typecheck
npm run lint
npm test
```

## Estructura

```
src/
  app/          pantallas (Expo Router)
  components/   piezas visuales e íconos SVG
  lib/          fechas, avisos, validación, respaldos
  store/        datos guardados (zustand + AsyncStorage)
  theme/        colores y tipografía
docs/           visión, funcionalidades y guía para publicar
store-assets/   imágenes para la ficha de Play Store
```

## Publicar

Ver [docs/publicar.md](docs/publicar.md).
