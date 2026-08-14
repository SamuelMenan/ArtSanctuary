# Plan complementario — Láminas faltantes del Canon

**Fecha:** 2026-06-08 · **Rev:** ampliado con el sistema profundo de partes (Bloque D).
**Complementa:** `docs/pr/importantes/canon/plan-canon-redesign.md` (rediseño) y `docs/pr/importantes/canon/plan-canon-anatomy-deep.md` (sistema profundo de medidas + modelo interactivo). Este doc dice QUÉ láminas faltan generar y cómo cablearlas.
**Prompts:** masculinos + overlays (Bloque B) en `docs/helps/canon-image-prompts.md`; femeninos en `docs/helps/canon-image-prompts-female.md`; **partes (Bloque D) en `docs/helps/canon-image-prompts-parts.md`**.

> Las láminas de cuerpo entero (A/B/C) NO bloquean el rediseño. El **Bloque D** (partes) es el grueso nuevo: muchísimas láminas de cada parte del cuerpo en sus dimensiones, estilo anatomy4sculptors en 2D. Tampoco bloquea: el `CanonPartPanel` cae a **zoom de la lámina principal** mientras una parte no tenga su asset.

> **Escala:** esto pasa de ~27 láminas (cuerpo entero) a **cientos** (partes × vistas × variantes). No se generan todas de golpe — el sistema degrada limpio por parte/vista que falte. Prioridad y conteos en §5 y §7.

---

## 1. Estado actual (inventario real)

Cada lámina = PNG limpio, fondo transparente, recorte ceñido coronilla→planta.

| Canon | frontal | lateral | posterior | overlays |
|---|---|---|---|---|
| academic (7.5) ♂ | ✅ | ✅ | ✅ | — |
| heroic (8) ♂ | ✅ | ✅ | ✅ | — |
| comic (8.5) ♂ | ✅ | ✅ | ✅ | — |
| academic-female (7.5) | ❌ | ❌ | ❌ | — |
| heroic-female (8) | ❌ | ❌ | ❌ | — |
| comic-female (8.5) | ❌ | ❌ | ❌ | — |

Overlays (esqueleto/músculos) y articulaciones: **0** en todos los cánones.

---

## 2. FALTA — Bloque A: figuras femeninas (prioridad alta)

**9 láminas:** {academic-female, heroic-female, comic-female} × {frontal, lateral, posterior}.

- Prompts listos en `canon-image-prompts-female.md` (frontal usa `heroic/frontal.png` como ref de SOLO estilo; lateral/posterior usan su propio frontal femenino ya generado).
- Carpetas `public/canon/<id>-female/` ya existen (con `.gitkeep`).
- Hoy el modelo femenino existe en `CANONS` (anchos femeninos) pero `CANON_LANDMARKS` femeninos son **alias del masculino** y NO hay entradas en `FIGURES` → por eso no aparecen en el selector.

**Al tener cada lámina (pipeline por canon):**
1. Colocar los 3 PNG en `public/canon/<id>-female/`.
2. Medir dims intrínsecas + recortar a bbox alpha si trae padding (igual que comic).
3. Medir `frac` reales con regla de píxeles (overlay 5% en `C:\tmp\ruler-*.png`, leído por mitades) — NO heredar del masculino: la mujer tiene cintura más alta, busto en 2.ª cabeza, etc.
4. Cablear:
   - `FIGURES['<id>-female']` (dims) en `figureMeta.ts` → al existir, el canon **aparece solo** en el selector (deja de estar "sin lámina").
   - `CANON_LANDMARKS['<id>-female']` con los `frac` medidos (reemplazar el alias).
5. Verificar superponiendo landmarks (`verify-*.png`).

**Aceptación por lámina:** PNG alpha real (sin fondo), figura entera (cabeza con pelo + pies completos), ortográfica simétrica, recorte ceñido uniforme entre las 3 vistas (mismas alturas Y), proporción correcta de cabezas.

---

## 3. FALTA — Bloque B: overlays anatómicos (prioridad media)

Capas `skeleton` / `muscles` (scaffolding listo: `lib/overlays.ts` `OVERLAY_ASSETS` vacío; carpetas `public/canon/<id>/overlays/` existen).

**Set completo = 2 capas × N cánones × 3 vistas.** Para los 3 masculinos actuales: 2×3×3 = **18 láminas**. Coste alto → priorizar:

- **Mínimo útil (6):** `skeleton-frontal` + `muscles-frontal` para academic/heroic/comic.
- **Medio (12):** + `lateral` de ambos para los 3.
- **Completo (18):** + `posterior`.
- (Si se suman los femeninos: ×2.)

**Requisito de alineación (crítico):** cada overlay debe estar dibujado sobre la MISMA silueta y con el MISMO recorte/aspecto que la lámina base de ese canon-vista (coronilla→planta), para que calce pixel a pixel (`ProportionChart` lo pinta con `next/image fill object-contain`).

**Al tener un overlay:**
1. PNG transparente en `public/canon/<id>/overlays/<layer>-<view>.png`.
2. Listar la vista en `OVERLAY_ASSETS[<id>][<layer>]` (`overlays.ts`) → el toggle se prende solo para ese canon-vista.

**Aceptación:** alpha real, registro EXACTO con la base (mismo bbox), línea limpia.

---

## 4. FALTA — Bloque C: articulaciones (datos, no láminas) (prioridad baja)

No son imágenes: es la posición `x` (horizontal) + `frac` (altura) de cada articulación por canon-vista. `lib/joints.ts` `CANON_JOINTS` vacío.

- Medir sobre cada lámina la `x` (0..1 de la caja) y `frac` de: hombros, codos, muñecas, caderas, rodillas, tobillos (+ cuello/base cráneo).
- Poblar `CANON_JOINTS[<id>][<view>]` + claves i18n `canon.jointNames.*`.
- Al haber data, el toggle "Articulaciones" se prende solo para ese canon-vista.

Pertenece al eje de DATOS medidos, no de generación IA. Se puede hacer sobre las láminas ya existentes sin generar nada nuevo.

---

## 4.5 FALTA — Bloque D: láminas de PARTES anatómicas (sistema profundo)

El grueso nuevo. Alimenta `plan-canon-anatomy-deep.md`: al dar clic/hover en una parte del modelo, su ficha muestra la **lámina dedicada de esa parte en todas sus dimensiones** con sus referencias (estilo anatomy4sculptors, en 2D). Dos entregables por parte: la **imagen** (asset) y el **path de región clicable** (dato medido, §3.1 del plan profundo).

### 4.5.1 Carpetas (creadas, con `.gitkeep`)

```
public/canon/parts/
  head/  neck/  torso/  pelvis/
  arm/   forearm/ hand/
  thigh/ leg/   foot/
```

Convención de archivo (espejo de la lámina de cuerpo): `public/canon/parts/<part>/<view>.png`, fondo transparente, recorte ceñido, ortográfico. Algunas partes tienen vistas propias además de frontal/lateral/posterior (ver tabla).

### 4.5.2 Inventario por parte (vistas + dimensiones a cotar)

| Parte | Carpeta | Vistas | Dimensiones cotadas (con fuente) |
|---|---|---|---|
| Cabeza | `head/` | frontal · lateral · posterior · ¾ | alto 1 cab · ancho 0.66 · prof 0.8 · tercios faciales · línea de ojos a ½ |
| Cuello | `neck/` | frontal · lateral | largo 0.33 · ancho 0.5 · prof 0.55 |
| Tórax | `torso/` | frontal · lateral · posterior | ancho 1.5 · prof 0.95 · alto ~2 · línea pezones 2.ª cab |
| Pelvis | `pelvis/` | frontal · lateral · posterior | ancho 1.5–1.7 · prof 0.95 · cresta ilíaca = cintura |
| Brazo (sup.) | `arm/` | frontal · lateral · posterior | largo 1.4 · grosor · codo = cintura |
| Antebrazo | `forearm/` | anterior · posterior | largo 1.15 · muñeca = entrepierna |
| **Mano** | `hand/` | **dorsal · palmar · lateral** | largo 0.9 (≈ cara) · palma ≈ ½ mano · dedo medio ≈ ½ mano · ancho palma ~0.4 · falanges |
| Muslo | `thigh/` | frontal · lateral · posterior | largo 2.0 · grosor |
| Pierna (inf.) | `leg/` | frontal · lateral · posterior | largo 1.7 · pantorrilla (punto ancho) |
| **Pie** | `foot/` | **dorsal · medial · lateral · plantar** | largo 1.0 (≈ cabeza) · alto empeine ~0.3 · ancho ~0.35 |

Sub-partes (futuro, anidamiento §3.1): mano → dedos/palma; pie → dedos/talón; cabeza → rasgos. Misma carpeta con sufijo (`hand/finger-*.png`).

> **Ampliación 2026-06-09:** el atlas pasa de 10 a **17 partes** (`plan-canon-hover-vistas-partes.md` §0): + hombro/deltoides, trapecio, codo, muñeca, glúteos, rodilla, tobillo. Sus vistas y prompts ya están en `docs/helps/canon-image-prompts-parts.md` (tabla "Partes NUEVAS", ~19 láminas más en el set completo). Carpetas `shoulder/ trapezius/ elbow/ wrist/ gluteus/ knee/ ankle/` se crean al llegar su primer asset.

### 4.5.3 Conteo

- **Mínimo útil (1 vista/parte, 10):** la vista principal de cada parte → el panel ya muestra imagen real en vez de zoom.
- **Medio (~28):** 3 vistas estándar para las 10 partes (las de 2 vistas cuentan 2).
- **Completo masculino (~33):** + vistas propias (mano dorsal/palmar/lateral, pie dorsal/medial/lateral/plantar, cabeza ¾).
- **×2 si se hacen femeninas.** ×N si se quieren por canon (en general las partes son canon-agnósticas → 1 set sirve para todos los cánones; solo se duplica si el dimorfismo lo amerita: pelvis ♀, tórax ♀).

> Decisión recomendada: las partes son **canon-agnósticas** (un set genérico, no por canon). El canon gobierna el cuerpo entero; la ficha de parte enseña anatomía general. Solo `pelvis`/`torso` pueden tener variante ♀.

### 4.5.4 Al tener una lámina de parte (pipeline)

1. PNG transparente en `public/canon/parts/<part>/<view>.png`, recorte ceñido.
2. Medir las **cotas** (px → fracción) de cada dimensión sobre la imagen → `dims[]` ya viven como dato en `anatomyParts.ts` (no se re-miden, se dibujan).
3. Medir el **path de región clicable** sobre la lámina de CUERPO (no la de la parte): contorno normalizado 0..1 por canon-vista → `partHits.ts` (§3.1; pipeline de píxeles ya probado en A3).
4. Cablear `anatomyParts.ts`: `image[view] = '/canon/parts/<part>/<view>.png'`.
5. i18n `canon.part.<part>.*` (nombre, dims, nota) es/en.
6. Verificar: hover resalta la región correcta; ficha calza imagen + cotas.

**Aceptación:** alpha real, ortográfica, cotas legibles y verificadas contra la fuente (Richer/Loomis/antropometría); el `path` de región sigue el contorno sin solaparse con partes vecinas.

---

## 5. Resumen de prioridad

| Bloque | Qué | Cantidad | Prioridad | Desbloquea |
|---|---|---|---|---|
| A | Figuras femeninas | 9 láminas | **Alta** | 3 cánones nuevos en selector/comparador/ghost |
| D | **Láminas de partes** | 10 → ~33 (×2 ♀) | **Alta** | Modelo interactivo: ficha de parte con imagen+dims (fallback zoom hasta tener asset) |
| B | Overlays esqueleto/músculos | 6–18 láminas | Media | Capas skeleton/muscles (estudio anatómico) |
| C | Articulaciones (data) | medición | Baja | Capa articulaciones |

---

## 6. Flujo de trabajo (igual que el masculino, ya probado)

1. Generar lámina con el prompt correspondiente.
2. Pasarla → se mide `frac`/dims con regla de píxeles (`System.Drawing`, debug en `C:\tmp\`).
3. Recortar a bbox alpha si hay padding.
4. Colocar en `public/canon/<id>[/overlays]/...`.
5. Cablear según el bloque: `FIGURES` / `CANON_LANDMARKS` (A) · `OVERLAY_ASSETS` (B) · `CANON_JOINTS` (C) · `anatomyParts.ts` `image[view]` + `partHits.ts` (D).
6. Verificar (superponer landmarks / hover de región) → tsc + 18 tests + doctor.

Relacionado: `docs/pr/importantes/canon/plan-canon-anatomy-deep.md` (sistema profundo + interactividad), `docs/helps/canon-image-prompts.md`, `docs/helps/canon-image-prompts-female.md`, `docs/pr/importantes/canon/plan-canon-png-refactor.md`, memoria `canon-improvement-plan` · `canon-anatomy-deep-plan`.
