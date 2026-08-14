---
title: "Utilidades compartidas (src/shared/lib/)"
audience: dev
status: stable
updated: 2026-08-14
owner: TBD
---

# Utilidades compartidas

Código isomórfico que consumen varias features. Documentado aquí porque son
piezas pequeñas y muy reutilizadas cuyo **comportamiento no obvio** (mutaciones
in-place, fallbacks silenciosos, consumo destructivo) causa bugs si se asume
mal.

Los subsistemas con doc propio no se repiten aquí: el motor de Canon
([`../features/tools/canon.md`](../features/tools/canon.md)), la compresión de
imagen ([`../features/image-compression.md`](../features/image-compression.md))
y la escala de medida
([`../features/tools/escala-medicion.md`](../features/tools/escala-medicion.md)).

## `tools/handoff.ts` — transferencia entre herramientas

El módulo más consumido (8 archivos). Mueve una imagen entre Boards, Grid y
Crop **preservando su tamaño físico en cm**, vía `sessionStorage`.

```ts
setHandoff(p: PhysicalImage): void
takeHandoff(): PhysicalImage | null   // lee Y CONSUME
peekHandoff(): PhysicalImage | null   // lee sin consumir
```

- ⚠️ **`takeHandoff()` es destructivo**: borra el payload antes de parsearlo. Si
  necesitas mirar sin consumir, es `peekHandoff()`.
- Los 3 son **fail-silent** (`try/catch` vacío): en SSR o con JSON corrupto
  devuelven `null` sin log.
- `widthCm`/`heightCm` van **sin escalar**; `widthScaledCm`/`heightScaledCm` y
  `squareCm` van **ya escalados**. No re-aplicar la escala al consumirlos.
- Para el round-trip a Boards lleva `boardId` + `objectId` (qué objeto
  reemplazar al volver) + `workspaceId`.

## `image/` — procesamiento de píxeles

Además de `canvas.ts` (documentado aparte), dos utilidades de recorte:

**`autocrop.ts`** — `computeContentBounds(imageData, tolerance = 18)` calcula el
bounding box del contenido real; `padBounds(b, pad, w, h)` lo expande sin
salirse. Si hay canal alpha usa transparencia; si no, compara contra el color
promedio de las **4 esquinas**. Devuelve `null` si la imagen es uniforme.

**`floodfill.ts`** — `floodErase(imageData, sx, sy, tolerance = 30)` es la varita
mágica. ⚠️ **Muta `imageData` in-place** (pone alpha a 0) y devuelve cuántos
píxeles tocó. Vecindad de 4, implementación iterativa con stack (no recursiva,
no desborda en imágenes grandes).

Ninguno tiene test.

## `mediums.ts` — catálogo de medios pictóricos

`MEDIUMS` (11 medios: óleo, acrílico, acuarela, gouache, tinta, cmyk, vinilo,
laca, esmalte, pastel, aerógrafo) con su `MixModel` y paleta de pigmentos
reales. Consumido por Color Mixing.

⚠️ **`getMedium(id)` nunca lanza ni devuelve `undefined`**: si el id no existe
cae a `MEDIUMS[0]` (óleo) en silencio. Los `id` son `string` suelto, no un
union — un typo no falla en compilación.

Los nombres de pigmento (`'Blanco Titanio'`) están **hardcodeados en español**,
a diferencia de `nameEs`/`nameEn` del medio.

## `useArtworkAutoFill.ts` — sugerencias EXIF al subir obra

Lee EXIF (`exifr`) + dimensiones de un `File` y sugiere campos del formulario.
Exporta el hook `useArtworkAutoFill` y tres funciones puras
(`inferCategoryFromExif`, `buildSuggestions`, `getPresets`) que existen
**exportadas para poder testearse** — pero no tienen test.

- Solo la categoría `fotografia` genera sugerencias desde EXIF; el resto solo
  tags.
- `getPresets('otro')` devuelve arrays vacíos (esa categoría no tiene presets).
- Los `label` y los valores de medio/técnica son **claves i18n**; los
  `TAG_PRESETS` en cambio son strings literales en español — inconsistencia
  conocida.

## `types.ts` — formas serializadas para el cliente

Tipos de la API tal como llegan al navegador (`Artwork`, `Collection`,
`ArtworkAuthor`, `ArtworkComment`). No confundir con las interfaces `I*` de
`src/backend/models/` — estos tienen casi todo opcional porque la API puede
popular u omitir.

⚠️ `Artwork` lleva `[key: string]: unknown`, lo que **desactiva el chequeo de
typos**: `artwork.loQueSea` compila. Solo `_id` e `imageUrl` son obligatorios.

## `workspaces/carnaval/` — reglamento de Corpocarnaval

Barrel en `index.ts` (`rules`, `validate`, `views`, `planos`, `lateralMirror`).
⚠️ **`domain.ts` queda fuera del barrel** a propósito y se importa por ruta
directa desde el registry, para no arrastrar `measure`/`boards/types` a todos
los consumidores.

**`validate.ts`** — motor puro de validación reglamentaria.
`validateBoceto(rule, measures)` devuelve un `BocetoReport` con porcentaje de
cumplimiento. Sutilezas que importan:
- `WARN_BAND = 0.1` → el 10% del rango más cercano a cada límite da `warn`.
- **`warn` cuenta como cumple**; solo avisa.
- `range.exact` tiene prioridad absoluta sobre `min`/`max`.
- Los ejes `na` (sin restricción) se excluyen del cómputo, no inflan el
  porcentaje.
- Los mensajes están hardcodeados en español, no pasan por i18n.

**`views.ts`** — qué 2 de los 3 ejes proyecta cada vista ortográfica.
Invariante: **ninguna vista usa `espesor`**, solo `alto`/`ancho`/`largo`.
`isPlanView` hoy es cierto solo para `superior`. ⚠️ `baseAlong(base, 'espesor')`
devuelve `base.largo` silenciosamente — el fall-through es alcanzable.

**`domain.ts`** — registra el escalador de Carnaval. Ratio directo de la
modalidad (10 para disfraz/comparsa, 15 para carroza/carro alegórico).
⚠️ Un workspace Carnaval **sin modalidad** cae al `defaultScaler` global
(215/14 ≈ 15.357), que no corresponde a ninguna modalidad real.

**`lateralMirror.ts`** — espejo entre planos laterales. El invariante crítico es
`mirroredFrom`: marca los objetos espejados para que la reconciliación pueda
borrarlos sin tocar los propios del plano. Tiene 2 tests rotos — ver
[`../ops/known-issues.md`](../ops/known-issues.md#7) antes de tocarlo.

## Cobertura de tests

Solo `colorMix`, `measure`, `validation/settings`, el motor de `canon/` (7
archivos) y `workspaces/carnaval/{planos,rules,lateralMirror}` tienen test.
`handoff`, `autocrop`, `floodfill`, `canvas`, `mediums`, `useArtworkAutoFill`,
`views` y `domain` **no**. Nota: los tests de `validate.ts` viven dentro de
`rules.test.ts`, no en un `validate.test.ts`.

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Firmas, consumidores y constantes verificados leyendo cada módulo completo.
