# Pipeline de trazado de regiones clicables (Canon · `partHits.ts`)

Traza los `path` SVG por parte del cuerpo SOBRE una lámina de Canon (decisión P9:
contorno real, nunca cajas). Probado con heroico-frontal (A3). Detalle del flujo:
`docs/pr/importantes/canon/plan-canon-hover-vistas-partes.md` (diagrama sequence).

## Flujo (por lámina)

```
1. extract-runs.ps1  -Image <lámina.png> -Out <runs.json>
     Silueta por flood-fill desde los bordes (el interior blanco encerrado por
     línea cuenta como figura). Salida: runs [x0,x1] por fila.

2. node build-polys.js <runs.json> <config.json> <outDir>
     Polígonos por parte usando los cortes (frac) del config + RDP.
     Salida: polys.json (px, para verificar) + paths.json (normalizado 0..1).

3. draw-verify.ps1 -Image <lámina.png> -Polys <polys.json> -Out <verify.png>
     Overlay coloreado por parte sobre la lámina → REVISIÓN VISUAL OBLIGATORIA.
     Artefacto → ajustar config/selector y repetir. Limpio → copiar paths.json
     a `src/shared/lib/canon/partHits.ts` (+ `npx vitest run src/shared/lib/canon`).
```

## Config por canon-vista (`configs/<canon>-<view>.json`)

Los cortes son FRACCIONES de la altura (0=coronilla, 1=planta), tomados de
`landmarks.ts` del canon + ajuste visual. La axila y el fin de manos se DETECTAN
solos (cambios en el nº de runs); si la silueta no los separa (posterior/lateral),
se declaran con `cuts.armpitFrac` / `cuts.handsEndFrac`.

### Bandas ANCLADAS a landmarks (recomendado — no teclear `frac`)

Las articulaciones (codo/muñeca/rodilla/tobillo) se anclan a un landmark en lugar
de ventanas `frac` a mano. En el config:

```json
"landmarks": { "ombligo": 0.39, "entrepierna": 0.48, "rodillas": 0.64, "pies": 0.93 },
"bands": {
  "elbow": { "mode": "sideLimb", "anchor": "ombligo",     "offset": -0.02,  "half": 0.018 },
  "knee":  { "mode": "legs",     "anchor": "rodillas",     "offset": 0.012,  "half": 0.032 }
}
```

- `anchor` = nombre de landmark (de `config.landmarks`, copiados de `landmarks.ts`).
- centro de la banda = `landmark + offset`; ventana = `centro ± half`.
- **Ventaja:** como cada lámina tiene sus landmarks, la banda se **auto-ubica** en
  cada canon-vista. Para mover/alargar: `offset` (nudge relativo, sigue al landmark)
  y `half` (longitud). No se vuelve a teclear un `frac` absoluto.
- Spans que NO son una articulación (deltoide, trapecio) siguen usando `from`/`to`.

### Brazos pegados (posterior/lateral): `mirror` + `symmetricTrunk`

Cuando el flood-fill no separa un brazo del torso (solo un lado abre):
- `"mirror": "auto"` — refleja el lado limpio de las partes PAREADAS (brazo/antebrazo/
  mano) al lado pegado (figura bilateralmente simétrica).
- `"symmetricTrunk": true` — el TRONCO (torso/pelvis, regiones centradas) toma el borde
  del lado limpio y lo espeja → tronco simétrico SIN el brazo fusionado. Sin esto, la
  espalda/lumbar arrastra el brazo pegado.
- `"cuts.armpitFrac"` / `"cuts.handsEndFrac"` — override de la detección de axila/fin de
  manos cuando la silueta no las delata.
- `centerSplit` (glúteo) y bandas `legs` ancladas bajo las manos evitan que las manos a
  la altura de la cadera contaminen glúteo/isquiotibiales.

## FRONTAL: trazar el DIBUJO del usuario (`paint-frontal.js` → `apply-frontal.js`)

La capa Músculos FRONTAL se TRAZA del dibujo del usuario
`public/canon/heroic/musculos.png` (el mapa exacto que quiere), re-exportado para
ALINEAR con la lámina `frontal.png` (siluetas casi idénticas → calza tal cual, sin
warp). La lámina sigue siendo `frontal.png` (innegociable). Pipeline:

```
1. node paint-frontal.js   → clasifica CADA PÍXEL a una región muscular por HUE +
     posición (no por bucket de color → un músculo sombreado no se fragmenta);
     dilata las etiquetas sobre las líneas negras (cierra huecos); contornea la
     máscara SÓLIDA de cada región (Moore+RDP) → configs/heroic-frontal-final.json
     (normalizado a la imagen 0..1).
2. node apply-frontal.js   → regenera HEROIC_FRONTAL en partHits.ts + tests.
```

- **Clasificación por HUE + posición** (`keyOf`): rosa→central=neck / lateral=shoulder
  (la clavícula rosa es hombro, no cuello) · azul=shoulder/foot · morado→columna-de-
  brazo=hand, cuerpo=trapezius(arriba)/flank(cintura lateral)/thigh(abajo) y muy-lateral
  abajo=hand (el puño cerca de la ingle) · verde-amarillo en brazo=bicep/forearm (por
  cy) · verde=abdomen/knee · crema=chest (cara→head) · piel/naranja=head/leg/pelvis.
  `isArm` distingue columna de brazo del torso por los RUNS (no por x).
- **Dilatación** (9 pasadas): las regiones vecinas se tocan en el centro de la línea
  negra → sin huecos blancos al pintar.
- Region-set del dibujo (15): head·neck·trapezius·shoulder·chest·**bicep·forearm·hand**·
  abdomen·flank·pelvis·thigh·knee·leg·foot. El brazo se divide en 4 (shoulder·bicep·
  forearm·hand); `bicep` se añadió a `regions.ts` + i18n. KEYS (paint) y ORDER (apply)
  deben listar cada key.
- Colores: `muscleColors.muscleColor(key,'frontal')` (paleta del dibujo, sin tocar
  posterior/lateral). Landmarks = los del canon (`frontal.png` mantiene proporciones).

> Histórico (eliminado por deuda técnica): el generador de vértices/curvas
> `build-frontal.js` (F1-F7) y los experimentos de warp/trace-por-blob. El dibujo
> alineado a frontal + clasificación por hue (paint) fue lo que funcionó.

## Limitaciones conocidas

- Lógica pensada para vistas SIMÉTRICAS con brazos a los lados (frontal/posterior).
- LATERAL: el brazo solapa la silueta del torso → el flood-fill no los separa;
  las partes del brazo se trazan a mano (polígono sobre el line-art) y se verifican
  con el mismo draw-verify (plan §1, V-lateral).
- Bugs ya cazados (no reintroducir): runs del pulgar contaminando el muslo, piernas
  que se separan ANTES de que terminen las manos (banda central FIJA del pubis las
  separa), cuello flareando a trapecios (clamp al ancho del mentón).
