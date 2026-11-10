---
title: "Notan (simplificación tonal)"
audience: frontend, product
status: stable
updated: 2026-11-10
owner: TBD
---

# Notan

> **Ruta:** `/dashboard/tools/notan` (también dentro de un workspace:
> `/dashboard/workspaces/[id]/tools/notan`). Requiere sesión, como el resto de
> `/dashboard`.

## Objetivo

Reducir una imagen a 2 o 3 masas de valor (negro / blanco, o negro / gris medio
/ blanco) para estudiar la composición de luces y sombras antes de pintar o
dibujar. Ver la entrada **Notan** en [`glossary.md`](../../glossary.md).

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `src/frontend/features/tools/notan/screens/NotanScreen.tsx` | Pantalla: barra de controles, panel ORIGINAL, panel NOTAN, avisos y descarga. |
| `src/frontend/features/tools/notan/hooks/useNotan.ts` | Selección y carga del archivo, lectura de píxeles y render del resultado en el canvas. |
| `src/frontend/features/tools/notan/lib/notanState.ts` | Puro: validación de archivo y dimensiones, fases de la vista, códigos de error. |
| `src/shared/lib/image/notan.ts` | Puro: luminancia, mapa tonal de 2/3 valores, ajuste de tamaño, nombre del archivo. |
| `src/shared/lib/image/notan.test.ts`, `…/notan/lib/notanState.test.ts` | Pruebas (vitest). |

Reutiliza `loadImage`, `canvasToBlob` y `downloadBlob` de
`src/shared/lib/image/canvas.ts`. Los textos viven en el bloque `notan.*` de
`src/shared/i18n/messages/{es,en}.ts`.

## Selección de la imagen

- Botón **SELECCIONAR IMAGEN** (o **CAMBIAR IMAGEN** si ya hay una) en la barra,
  o el recuadro "Elige una imagen para empezar" del panel ORIGINAL. Ambos abren
  un `<input type="file">` local.
- **La imagen no se sube al servidor**: se lee con `URL.createObjectURL` y se
  procesa en el navegador. La URL local se libera al cambiar de imagen y al
  salir de la pantalla.
- Cancelar el diálogo de archivo no cambia nada.

### Formatos y límites

| Regla | Valor | Resultado si no se cumple |
|---|---|---|
| Tipo | `image/png`, `image/jpeg`, `image/webp` | "Formato no admitido…" (GIF, SVG, PDF, texto… se rechazan) |
| Archivo presente y no vacío | — | "No se recibió ningún archivo o está vacío." |
| Peso | ≤ 25 MB (`NOTAN_MAX_FILE_BYTES`) | "La imagen supera el máximo de 25 MB." |
| Píxeles decodificados | ≤ 40 MP (`NOTAN_MAX_PIXELS`) | "La imagen es demasiado grande…" |
| Decodificable por el navegador | — | "No se pudo leer la imagen…" |

Un archivo rechazado por tipo o peso **no** descarta la imagen que ya estaba
cargada. Un archivo que sí se intenta leer y falla deja la pantalla sin imagen,
con el error visible.

## Procesamiento

Todo ocurre en el navegador con Canvas 2D, sobre píxeles reales:

1. La imagen se dibuja en un canvas de trabajo. Si su lado largo supera
   **2048 px** (`NOTAN_MAX_DIM`) se reduce conservando la proporción
   (`imageSmoothingQuality = 'high'`) y el panel NOTAN muestra el aviso
   "Procesada a W×H px (original W×H px)".
2. `getImageData` obtiene una **copia** de los píxeles. La imagen original no
   se modifica: el panel ORIGINAL muestra el archivo tal cual, sin filtros.
3. La luminancia de cada píxel se calcula **una vez por imagen**:

   ```
   L = 0.299·R + 0.587·G + 0.114·B      (Rec. 601, 0–255, sin corrección gamma)
   ```

   Se evalúa como `(299R + 587G + 114B) / 1000` para que el blanco puro dé
   exactamente 255.
4. Cada vez que cambian la imagen, el umbral o el modo se recalcula el mapa
   tonal sobre esa luminancia (una pasada) y se pinta con `putImageData`. El
   cálculo se agenda con `requestAnimationFrame`: al mover el slider deprisa
   solo se procesa el último valor.
5. El **canal alfa se copia sin cambios**: lo transparente sigue transparente.
   El panel NOTAN muestra un damero detrás para que se vea.

### Umbral

Slider **UMBRAL**, entero de 0 a 255 (128 por defecto). Es el punto central de
decisión en ambos modos.

### Modo de 2 valores (TONO MEDIO desactivado)

| Luminancia | Resultado |
|---|---|
| `L < U` | Negro `RGB(0, 0, 0)` |
| `L ≥ U` | Blanco `RGB(255, 255, 255)` |

Extremos: con U = 0 toda la imagen queda blanca; con U = 255 todo queda negro
salvo los píxeles de blanco puro (L = 255).

### Modo de 3 valores (TONO MEDIO activado)

Banda de gris de semiancho fijo `NOTAN_MID_BAND = 32`, centrada en el umbral:

| Luminancia | Resultado |
|---|---|
| `L < U − 32` | Negro `RGB(0, 0, 0)` |
| `U − 32 ≤ L < U + 32` | Gris medio `RGB(128, 128, 128)` (`NOTAN_MID_GRAY`) |
| `L ≥ U + 32` | Blanco `RGB(255, 255, 255)` |

Con U < 32 no hay negro; con U > 223 no hay blanco. Nunca se generan tonos
intermedios adicionales. La etiqueta de la barra muestra **2 VALORES** o
**3 VALORES** según el checkbox.

## Vista previa

- **ORIGINAL** (izquierda): la imagen elegida, sin efectos.
- **NOTAN** (derecha): un `<canvas>` con el resultado (`role="img"` y
  `aria-label` con el modo y el umbral).
- En pantallas estrechas los paneles se apilan y la barra de controles envuelve
  en varias filas.

## Descarga

- Botón **DESCARGAR PNG**, deshabilitado mientras no haya un resultado válido
  (fase `ready`).
- Exporta el **canvas del resultado** (nunca el original) como PNG, conservando
  el alfa y la resolución de trabajo.
- Nombre: `notan-{2|3}-valores-umbral-{U}.png`, con el modo y el umbral con los
  que se pintó el canvas (p. ej. `notan-3-valores-umbral-170.png`).
- Si falla la conversión aparece "No se pudo generar el PNG para descargar."

## Estados y errores

| Fase | Qué se ve |
|---|---|
| `empty` | Recuadro para elegir imagen; "El resultado aparecerá aquí"; descarga deshabilitada. |
| `loading` | "Cargando imagen…" con spinner. |
| `processing` | "Procesando…" mientras se pinta el primer resultado. |
| `ready` | Resultado visible; descarga habilitada. |
| `error` | Franja de error (`role="alert"`) con el motivo. |

Los mensajes de estado se anuncian a lectores de pantalla (`aria-live`). Los
fallos se registran en consola con el prefijo `[notan]` (`console.warn` para un
archivo ilegible, `console.error` para fallos inesperados de canvas o
descarga).

## Pruebas

`npx vitest run src/shared/lib/image/notan.test.ts src/frontend/features/tools/notan`:

- Fórmula de luminancia y blanco/negro exactos.
- Modo 2: solo {0, 255}; reparto en el umbral; U = 0 y U = 255.
- Modo 3: solo {0, 128, 255}; límites de la banda; U = 0 y U = 255.
- Un cambio de umbral cambia el resultado en ambos modos; 2 → 3 → 2 vuelve al
  mismo resultado.
- Alfa conservado; los buffers de entrada no se mutan; umbral, modo o tamaños
  inválidos lanzan `RangeError`.
- Validación de archivo (ausente, vacío, tipo, peso) y de dimensiones.
- La descarga solo se habilita en `ready`; mensajes por fase; códigos de error.

El proyecto no tiene entorno DOM en vitest (sin jsdom ni Testing Library), así
que el render del componente no tiene pruebas automáticas; se verificó en
Chrome (ver abajo).

## Limitaciones

- **Banda de gris fija** (±32): no se puede ajustar desde la interfaz.
- **Resolución máxima 2048 px** de lado largo; la descarga sale a esa
  resolución, no a la original.
- Sin desenfoque previo ni simplificación de formas: el resultado es un umbral
  por píxel, así que las texturas finas generan ruido.
- No recibe imágenes de Tableros ni de otras herramientas (`?handoff=1`) ni las
  envía de vuelta; tampoco permite elegir imágenes de las colecciones.
- Sin deshacer/rehacer.
- El nombre del archivo descargado está en español en ambos idiomas.

## Última verificación

- Fecha: 2026-11-10
- Verificado: `npx tsc --noEmit`, pruebas de Notan (30), `npm test` completo,
  `npm run build`, y una prueba en Chrome headless contra el dev server:
  - estado inicial;
  - rechazo de `.txt`, `.gif` y PNG dañado;
  - PNG con alfa, JPEG, WebP y JPEG de 5000×4000;
  - umbral 0/255;
  - 2 ↔ 3 valores y 40 cambios rápidos;
  - descargas en ambos modos, comprobando los colores del PNG descargado;
  - vista a 390 px sin scroll horizontal.
