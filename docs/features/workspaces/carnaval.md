---
title: Carnaval Workspace
audience: backend, frontend, product
status: stable
updated: 2026-08-15
owner: TBD
---

# Workspace Carnaval (Corpocarnaval)

> ⚠️ **Corregido 2026-08-14** tras verificar contra el código. Los errores que
> tenía este doc, por si quedó alguna copia circulando:
> - Listaba **6 modalidades** (incluía *Murga* y *Carroza No Motorizada*).
>   Reales hay **4**: `disfraz`, `comparsa`, `carroAlegorico`, `carroza`.
> - Decía que se valida "según el `ProjectKind`". Falso: `ProjectKind` es
>   `'libre'|'carnaval'`; la validación va por **`modality`**.
> - Los planos obligatorios no son "Frontal siempre, Lateral solo carrozas":
>   son **las 5 vistas siempre** (frontal, posterior, lateralIzq, lateralDer,
>   superior) + `bastidores`/`jugadores` solo si `rule.requiresPlayerZones`.
>   "Lateral" no existe como plano único.
> - "Figuras a escala humana (1.70m)" — falso: `humanRefCm = 15` (cm de
>   boceto) para disfraz/comparsa, y `null` para las carrozas.
> - "Altura mínima 0.20m del suelo" — **esa regla no existe** en `rules.ts`
>   ni en `validate.ts`.
> - `WorkspaceHost` y `HumanFigure` — **no existen como símbolos**. El sistema
>   real es `BoardExtension` (ver
>   [`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md)).

> **Actualizado 2026-08-15.** Dos cambios que este doc ya recoge:
> - **La tabla de Disfraz Individual cambió dos veces en dos días** y ahora está
>   de vuelta en sus valores originales (§3.1). Cualquier número de cota que
>   leas fuera de `rules.ts` puede ser de una versión muerta.
> - La figura humana pasó de silueta SVG dibujada por código a **lámina de
>   Canon** (§4.1). El módulo `carnaval/lib/humanFigure.ts` **ya no existe**: lo
>   sustituye `carnaval/lib/carnavalHumanPlate.ts`.

Módulo especializado de ArtSanctuary enfocado en la acreditación técnica de artesanos para el Carnaval de Negros y Blancos de Pasto.

## 1. Visión General
A diferencia del Workspace "Libre", el **Carnaval Workspace** impone reglas de negocio estrictas, tipologías de vistas (Planos) y validaciones automatizadas para garantizar que los proyectos presentados por los artesanos cumplan con los requerimientos legales y físicos de Corpocarnaval (alturas máximas, dimensiones de bastidores, cantidad máxima de figuras, etc.).

## 2. Arquitectura Base
El ecosistema de Carnaval está regido por dos componentes principales de base de datos:
- **`CarnivalProject`**: Entidad contenedora del proyecto. Define la modalidad (ej. *Carroza*, *Disfraz Individual*) y gestiona metadatos del artista.
- **`Board` (Motor Gráfico)**: Los lienzos de dibujo (Konva) son reutilizados. Cada plano oficial (ej. *Plano Frontal*) es instanciado como un `Board` asociado al proyecto.
- **`CarnivalProjectVersion`**: Instantáneas de solo lectura (Snapshots) que guardan el estado de los planos de un proyecto en el tiempo para revisiones de jurados. Optimizado con conteos (`objectCount`) para no bloquear el Event Loop.

## 3. Modalidades y Planos Reglamentarios
El motor valida según la **`modality`** del proyecto (`getCarnavalRule(modality)`).
Las 4 modalidades reales (`rules.ts`, y mismo enum en `CarnivalProject.ts`):
- `disfraz` (Disfraz Individual) · `comparsa` · `carroAlegorico` (Carro Alegórico) · `carroza` (Carroza).

### 3.1 La cota que más confunde: el ALTO de Disfraz Individual

`rules.ts` es la **fuente única**; esta tabla está aquí solo porque la sutileza
del `alto` no se deduce leyendo un `{ min, max }`:

| Modalidad | `dims.alto` en código | Qué publica la tabla oficial | Desde dónde se mide |
|---|---|---|---|
| `disfraz` | **27–30** | 12–15 | La tabla da la obra **de los hombros hacia arriba**; el código guarda el **TOTAL desde la base** = 15 (figura humana) + 12…15. |
| `comparsa` | 20–25 | 20–25 | **De los hombros hacia arriba** — la figura humana NO cuenta, y el código lo guarda tal cual. |

Las dos modalidades comparten `humanRefCm = 15` y `scale = 10`, así que es fácil
asumir que también comparten criterio de medida. **No lo hacen** — y en
`disfraz` el número del código **no coincide con el de la tabla oficial**, a
propósito: la guía se dibuja desde la base y el Inspector mide desde la base.

⚠️ **Esta tabla ya ha cambiado dos veces.** Verificar contra el comunicado antes
de fiarse de cualquier número, incluidos los de este doc:

| Versión | ALTO publicado | `dims.alto` | Otras cotas |
|---|---|---|---|
| Original del comunicado | 12–15 | 27–30 | ancho 15–25 · largo 10–20 |
| Rectificación intermedia (`image.png`, 2026-08-14) | 30–35 (ya total) | 30–35 | ancho 20–25 · largo 20–25 |
| **Vigente** (`medidasfinales.jpeg`, 2026-08-15) | **12–15** | **27–30** | **ancho 15–25 · largo 10–20** |

O sea: Corpocarnaval **volvió a la tabla original**. Transcripción e imágenes en
[`../../../.plans/business/comunicados/Comunicado_003_2026.md`](../../../.plans/business/comunicados/Comunicado_003_2026.md).

**Efecto colateral que sorprende:** el cuadro de la cuadrícula de `disfraz` bajó
de 5 cm a **1 cm**. No se configura a mano — `carnavalGridSquareCm()` calcula el
gcd de las medidas, y 27 y 25 son coprimos. Solo cambia el fondo por defecto de
los boards **nuevos**; los guardados conservan su `background.squareCm`. (El
campo `rule.gridSquareCm` existe pero **no lo lee nadie**: el valor efectivo
sale siempre del gcd.)

⚠️ **Consecuencia sin resolver:** el Inspector excluye la figura humana de la
envolvente que mide (§5), así que en `disfraz` mide solo la obra sobre los
hombros y reporta "bajo mínimo" en bocetos correctos. Está anotado como
`PENDIENTE` en `carnavalInspect.ts` y en
[`../../ops/known-issues.md`](../../ops/known-issues.md). El arreglo tiene que
ser **por modalidad**, porque en `comparsa` el comportamiento actual es el
correcto.

Dependiendo de la modalidad, el sistema exige generar ciertos **Planos**:
- **Frontal**: Obligatorio en todos.
- **Lateral**: Obligatorio en carrozas y carros.
- **Posterior**: Opcional/Obligatorio según modalidad.
- **Superior (Planta)**: Distribución espacial.
- **Detalle Jugadores**: Interacción humana.
- **Estructura/Bastidores**: Chasis interior.

## 4. Extensiones del Board (Plugins)
Al entrar al Workspace de Carnaval, el `Board` muta utilizando el sistema de
extensiones `BoardExtension` (ver
[`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md)):
1. **CarnavalGuideLayer**: Inyecta mallas dinámicas obligatorias y la envolvente
   reglamentaria de la vista activa.
2. **CarnavalInspector**: Panel lateral específico para reglas de negocio (validación en tiempo real).
3. **CarnavalOverlays**: Líneas de cota automáticas, advertencias in-canvas y el
   botón que inserta la figura humana (§4.1).

### 4.1 Figura humana de referencia — lámina de Canon

**Desde 2026-08-15 la figura humana es una lámina PNG de Canon**, no una silueta
dibujada por código. `carnaval/lib/humanFigure.ts` (12 `path` SVG del maniquí
procedural de 7.5 cabezas, solo vista frontal) **se borró**; lo sustituye
`carnaval/lib/carnavalHumanPlate.ts`.

Cómo funciona `humanPlateFor(plano, shouldersCm, canonId?)`:

| | |
|---|---|
| **Canon** | `heroic` (8 cabezas) — `CARNAVAL_CANON_ID`. |
| **Vista** | Se elige por el **plano activo**: `frontal`→frontal, `posterior`→posterior, `lateralDer`→lateral, `lateralIzq`→lateral **espejada** (`flipX`), `superior`→**`null`** (la lámina es un alzado; en planta no significa nada y el botón está oculto). |
| **Escala** | La lámina va a sangre (coronilla en el borde superior, planta en el inferior), así que la altura total sale de `shouldersCm / (1 - shoulderFrac())`. `shoulderFrac` lee el landmark `hombros` de Canon (`frac 0.16` en heroico) → altura total ≈ 17.86 cm para los 15 cm reglamentarios. |
| **Fuente de los datos** | `@shared/lib/canon/plates` (dims intrínsecas + ruta) y `@shared/lib/canon/landmarks` (la fracción de hombros). Remedir la lámina en Canon actualiza también la figura de Carnaval, sin tocar Carnaval. |

**Por qué las 3 vistas de Canon**: `frontal`/`lateral`/`posterior` se crearon
precisamente para calzar con los planos geométricos de Carnaval. Solo hay
sincronía **de perspectiva**, no de instancia: insertar la figura afecta al
plano activo y nada más — cada plano es un `Board` independiente.

⚠️ **La regla de dependencias prohíbe `workspaces/carnaval → tools/canon`**
(ver [`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md)).
Por eso los metadatos de lámina se movieron a `src/shared/lib/canon/plates.ts`
y `tools/canon/lib/figureMeta.ts` quedó como re-export. Importar `figureMeta`
desde aquí compila pero **viola la arquitectura**.

⚠️ **`HUMAN_FIGURE_NAME = 'Figura humana'` es un contrato por string.**
`carnavalInspect.objectsBBoxPx` filtra por ese literal exacto para excluir la
figura de la envolvente medida. Renombrar la capa desde la UI de capas hace que
el Inspector empiece a medir la figura como si fuera obra, **sin ningún error
visible**.

### 4.2 `baseOffset` — por qué la figura salía descentrada

La guía reglamentaria se dibuja dentro de un `Group` de Konva **trasladado** por
`baseOffset`: el desplazamiento en cm que alinea la envolvente a la esquina de un
cuadro de la cuadrícula (`gridAlignedOffsetCm`). Los objetos del board, en
cambio, viven en coordenadas de mundo **sin desplazar**.

Todo lo que deba quedar centrado en la guía tiene que aplicar ese mismo offset.
Se calcula **una sola vez** en `board/context.tsx` y se expone en el contexto
(`useCarnavalBoard().baseOffset`) para que `CarnavalLayers` (Konva) y
`CarnavalOverlays` (HTML) no puedan divergir. Antes se recalculaba en un solo
sitio y la figura entraba desplazada.

El valor concreto **depende de la tabla vigente**, así que no vale memorizarlo:
en `disfraz` frontal la envolvente empieza en −12.5 cm y el offset es lo que
falte para caer en una línea del cuadro — **0.5 cm** con el cuadro de 1 cm de
hoy, y era 2.5 cm cuando el cuadro medía 5. Hay test de regresión en
`carnavalGuide.test.ts`; si cambia el reglamento, ese test cambia con él y eso
es señal, no ruido.

## 5. Reglas de Validación (Motor Reglamentario)

Reglas en `src/shared/lib/workspaces/carnaval/rules.ts`, motor de validación en
`validate.ts`. Lo que valida realmente:

- **Rangos por eje y modalidad** (`alto`, `ancho`, `largo`, `espesor`): cada uno
  con `min`/`max` o un valor `exact`.
- **Banda de advertencia**: `WARN_BAND = 0.1` → el 10% del rango más cercano a
  un límite da `warn`. Un `warn` **cuenta como cumple**, solo avisa.
- **Tolerancia exacta**: `EXACT_TOLERANCE_CM = 0.1`.
- **Zonas de jugadores/bastidores**: solo si `rule.requiresPlayerZones`.

No valida holgura al suelo ni "identificación de figuras humanas": ninguna de
esas dos reglas existe. La única relación con la figura humana es que
`carnavalInspect.ts` **excluye** del bounding box los objetos cuyo `name` sea
`HUMAN_FIGURE_NAME` (junto con textos y stickies): son referencia, no obra.
Esa exclusión es correcta en `comparsa` y **hoy es incorrecta en `disfraz`** —
ver §3.1.

Detalle del motor en
[`../../architecture/shared-lib.md`](../../architecture/shared-lib.md).

## 6. Planos obligatorios

`planosForModality` (`planos.ts`) genera **siempre las 5 vistas geométricas**:
`frontal`, `posterior`, `lateralIzq`, `lateralDer`, `superior` — más
`bastidores` y `jugadores` únicamente si la modalidad lo requiere.

Cada plano es un `Board` que apunta al proyecto vía **`Board.projectId`**; el
proyecto **no** guarda un array de planos.

## 7. Expediente y Biblioteca Cultural
El Workspace incluye rutas adicionales orientadas a la formalidad:
- `/dashboard/workspaces/[id]/expediente`: Resumen técnico, historial de versiones y estado de acreditación.
- `/dashboard/workspaces/[id]/recursos`: **Biblioteca Cultural**. Descarga de PDFs oficiales, normativas, y comunicados históricos (Phase 10).
- `/dashboard/workspaces/[id]/boards/[boardId]`: el tablero de un plano concreto.
- `/dashboard/workspaces/[id]/tools/[tool]`: herramientas dentro del contexto del workspace.

## 8. Tests

Lógica pura, sin React (no hay jsdom ni testing-library en el repo):

- `src/shared/lib/workspaces/carnaval/{rules,planos,lateralMirror}.test.ts` —
  los tests de `validate.ts` viven dentro de `rules.test.ts`, no en un archivo
  propio.
- `carnaval/lib/carnavalGuide.test.ts` — incluye la regresión de `baseOffset`
  (§4.2).
- `carnavalHumanPlate.test.ts` — mapeo plano→lámina, espejo del lateral, `null`
  en superior y la escala por `shoulderFrac`.

`carnavalInspect.ts` y los componentes del board **no tienen test**.

## Última verificación

- Fecha: 2026-08-15
- Commit: HEAD (árbol de trabajo, cambios sin commitear)
- Verificado leyendo `rules.ts`, `carnavalHumanPlate.ts`, `carnavalInspect.ts`,
  `board/context.tsx`, `CarnavalLayers.tsx` y `CarnavalOverlays.tsx`.
  `npx vitest run` pasa: 20 archivos, 161 tests.
