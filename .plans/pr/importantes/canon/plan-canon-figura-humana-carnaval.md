# Plan — Figura humana de Carnaval con láminas de Canon (heroico, 3 perspectivas)

**Fecha:** 2026-08-14
**Estado:** implementado (2026-08-14) — pendiente la verificación visual de la línea
de hombros descrita en *Riesgos*.
**Relacionado:** `.plans/pr/importantes/canon/plan-canon-png-refactor.md`,
`.plans/pr/importantes/canon/plan-canon-png-features.md` (su punto "lo que muere",
línea 121, daba por imposible unificar `humanFigure` con Canon — este plan lo revive
ya que ahora **sí** hay láminas raster que unificar).

## Problema

El botón **"Figura humana 15 cm"** del board de Carnaval
(`carnaval/board/CarnavalOverlays.tsx:42-56`) inserta una silueta **dibujada a mano en
SVG por código** (`carnaval/lib/humanFigure.ts`): 12 `path` de polígonos, viewBox
200×750, proporción de **7.5 cabezas**. Es el maniquí procedural que Canon ya abandonó.

Tres defectos:

1. **Canon obsoleto.** 7.5 cabezas (académico), cuando la referencia de la suite es
   **heroico (8 cabezas)**.
2. **Una sola perspectiva.** La misma silueta frontal se inserta en el plano frontal,
   en los laterales y en el posterior. Las láminas de Canon existen justamente en
   `frontal / lateral / posterior` para calzar con los planos de Carnaval.
3. **Calidad.** Polígonos planos frente a láminas profesionales ya en el repo.

## Qué existe ya (verificado)

| Pieza | Dónde | Estado |
|---|---|---|
| Láminas heroico | `public/canon/heroic/{frontal,lateral,posterior}.png` | ✅ las 3 |
| PNG transparente | alfa de esquina = 0 en las 3 | ✅ no tapan la guía |
| Encuadre a sangre | tinta de `y:0` a `y:h` → coronilla arriba, planta abajo | ✅ el `frac` mapea directo |
| Dims intrínsecas | `tools/canon/lib/figureMeta.ts:36-40` | ✅ 395×1310 · 216×1312 · 454×1471 |
| Altura de hombros | `shared/lib/canon/landmarks.ts:51` → `hombros frac 0.16` | ✅ medida sobre la lámina |
| Línea de 15 cm | ya la pinta la guía (`carnavalGuide.ts:85-93`) | ✅ no hay que dibujarla en la lámina |
| Volteo horizontal | `BoardObject.flipX` (`shared/lib/boards/types.ts:32`) | ✅ para el lateral izquierdo |

**La aritmética no cambia.** Hombros a `frac 0.16` ⇒ planta→hombros = `0.84` de la
altura, exactamente el `FEET_TO_SHOULDER_RATIO` que ya usa `humanFigure.ts`. La figura
sigue midiendo **17,86 cm** de alto para dar los 15 cm hasta los hombros (1,786 m
reales a 1:10). El cambio es visual y por vista, no métrico.

Anchos resultantes (`hCm × w/h` de cada lámina):

| Plano de Carnaval | Lámina | Ancho | Volteo |
|---|---|---|---|
| frontal | `frontal.png` | 5,39 cm | — |
| posterior | `posterior.png` | 5,51 cm | — |
| lateralDer | `lateral.png` | 2,94 cm | — (el perfil mira a la derecha) ✅ decidido |
| lateralIzq | `lateral.png` | 2,94 cm | `flipX: true` |
| superior | — | — | el botón ya está oculto (`CarnavalOverlays.tsx:34-38`) |

## Restricción de arquitectura

`features/workspaces/README.md:40-42` fija la dirección de dependencias:
**`workspaces/<tipo> → boards + shared`**. Importar `tools/canon/lib/figureMeta` desde
`workspaces/carnaval` la rompería. `shared/lib/canon/landmarks.ts` ya está donde toca;
lo que falta mover es el metadato de las láminas.

---

## Fases

### F1 — Bajar el metadato de láminas a `shared`

- **Nuevo** `src/shared/lib/canon/plates.ts`: mueve tal cual `View`, `VIEWS`, `Meta`,
  `FIGURES`, `AVAILABLE_CANON_IDS`, `resolveCanonId`, `figureSrc`, `figureDims`.
- `tools/canon/lib/figureMeta.ts` queda como **re-export** (`export * from
  '@shared/lib/canon/plates'`) → cero cambios en los ~15 consumidores de Canon.
- De paso: el comentario de `Meta.src` (líneas 21-23) menciona un override
  `musculosblanco.png` para heroico frontal que **ya no existe** en `FIGURES`. Corregir.

*Coste: ~40 líneas movidas, 0 de lógica nueva.*

### F2 — `carnavalHumanPlate.ts` sustituye a `humanFigure.ts`

Nuevo `carnaval/lib/carnavalHumanPlate.ts`:

```ts
const CARNAVAL_TO_CANON_VIEW: Record<CarnavalView, { view: CanonView; flipX: boolean } | null>
export function humanPlateFor(view, shouldersCm, canonId = 'heroic'):
  { src, wCm, hCm, flipX } | null
```

- La fracción de hombros sale de `getLandmarks(canonId).find(l => l.key === 'hombros')`,
  **no** de una constante local: si se remide la lámina, Carnaval se entera solo.
- `hCm = shouldersCm / (1 - shoulderFrac)`; `wCm = hCm × w/h` de `figureDims`.
- **Borrar** `humanFigure.ts` y `humanFigure.test.ts`; test nuevo equivalente que
  además cubra las 4 vistas y el volteo.

### F3 — Enganchar el botón

En `CarnavalOverlays.tsx:42-56`, `addHuman` pasa a insertar la lámina:

```ts
const p = humanPlateFor(view, shouldersCm)
addObject({ type: 'image', src: p.src, flipX: p.flipX,
            x: -pxOf(p.wCm)/2, y: -pxOf(p.hCm), w: pxOf(p.wCm), h: pxOf(p.hCm),
            rotation: 0, name: 'Figura humana' })
```

**Invariante que rompe en silencio:** el nombre `'Figura humana'` es la clave exacta
con la que `carnavalInspect.ts:23` excluye la figura de la envolvente medida. Si se
renombra el objeto, el Inspector empieza a medir la figura como si fuera obra.
Conviene extraer la constante a un módulo compartido en lugar del literal repetido.

*Opcional:* insertar con `locked: true` — es una referencia, no obra, y hoy se arrastra
por accidente con facilidad.

### F4 — Alcance del botón ✅ decidido

**El botón actúa solo sobre el plano activo**, pero cada plano recibe **su**
perspectiva correcta. Es lo que F1–F3 ya entregan: cero backend, todo frontend.

Descartado por ahora (seguimiento posible): que un clic coloque la figura en los 4
planos geométricos a la vez. Si algún día se quiere, el patrón a reutilizar es
`syncCarnavalLateralMirror` (`boards.service.ts:116-159`), que ya propaga objetos
entre los planos de un proyecto.

### F5 — Limpieza

- i18n `boards.addHuman` — hoy "Figura humana"; valorar "Figura humana (heroico)".
  Solo hay 2 ficheros de mensajes (`es.ts:772`, `en.ts:766`).
- `features/workspaces/README.md:35` lista `humanFigure` en el árbol → renombrar.
- `plan-canon-png-features.md:121` da por muerta esta unificación → anotar que revive.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `frac 0.16` está **medido a ojo** sobre la lámina; la línea de guía se dibuja a 15 cm exactos. Si la medida está desviada, los hombros del dibujo no caerán sobre la línea rosa y se verá. | Verificación visual obligatoria en el plano frontal antes de cerrar. Es un dato ya en uso por el chart de Canon, así que un error afectaría también allí. |
| El PNG pesa 372–776 KB. | El board persiste **la URL**, no el binario; se sirve estático desde `public/`. Sin impacto en el documento. Sí conviene comprobar que el export del Expediente carga imágenes remotas. |
| `posterior.png` tiene otra altura intrínseca (1471 vs 1310) y comparte los `frac` del canon. | Correcto por diseño: el `frac` es relativo a la altura de la lámina y las 3 van a sangre. Cubrir con test. |
| La lámina lateral mira a la derecha; asignarla al plano equivocado espeja al revés. | Resuelto: va sin espejar en `lateralDer` (el mismo origen que usa hoy el espejo automático) y con `flipX` en `lateralIzq`. Confirmar en pantalla al implementar. |

## F6 — Centrado respecto a la guía (corrección post-implementación)

La primera versión insertaba la lámina en `x = -w/2`, centrada en el origen del
mundo. Salía **descentrada respecto a la caja**: la guía no se pinta en el origen
sino dentro de un `Group` desplazado por `baseOffset` —el ajuste que alinea sus
bordes a la esquina de un cuadro de la cuadrícula—, mientras que los objetos del
board viven en coordenadas de mundo sin desplazar. En disfraz frontal ese desfase
es de **2,5 cm** (la envolvente empieza en −12,5 y el cuadro es de 5 cm).

Arreglo: `baseOffset` sube al contexto (`carnaval/board/context.tsx`) y lo leen
**tanto** `CarnavalLayers` (que antes lo recalculaba) como `CarnavalOverlays` al
insertar la figura. Una sola fuente para el desplazamiento.

Test de regresión en `carnavalGuide.test.ts`: fija que el offset de disfraz frontal
es `{x: 2.5, y: 0}` y documenta por qué cualquier cosa anclada a la guía debe sumarlo.

## Alcance

~5 ficheros tocados, 1 nuevo, 2 borrados. Sin backend en la opción A, sin dependencias
nuevas, sin assets nuevos.
