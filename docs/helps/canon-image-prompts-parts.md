# Prompts para generar las láminas de PARTES anatómicas (Bloque D)

Alimentan la **ficha de parte** (`CanonPartPanel`, A4/A5 de
`plan-canon-anatomy-deep.md`). Inventario/pipeline: `plan-canon-laminas-faltantes.md`
§4.5. Hasta tener un asset, la ficha cae a **zoom de la lámina principal** — esto
NO bloquea nada; generar por prioridad.

- Destino: `public/canon/parts/<part>/<view>.png` (carpetas de las 10 originales ya
  creadas; las 7 nuevas — `shoulder/ trapezius/ elbow/ wrist/ gluteus/ knee/ ankle/` —
  se crean al llegar su primer asset).
- Las partes son **CANON-AGNÓSTICAS**: un solo set (hombre adulto neutro) sirve a
  todos los cánones. Solo pelvis/tórax podrían ganar variante ♀ después.
- **Prioridad:** mano → pie → cabeza (las que el usuario consulta primero), luego
  articulaciones (rodilla/codo/muñeca/tobillo — los "mecanismos" de Bridgman), luego
  el resto. Con 1 vista por parte el panel ya muestra imagen real.
- Atlas ampliado a **17 partes** (auditoría vs Richer/Bridgman/HPC):
  `plan-canon-hover-vistas-partes.md` §0.
- **Sin cotas dibujadas**: las dimensiones las dibuja la app encima (A6) usando los
  ratios de `anatomyParts.ts`. La lámina va LIMPIA (igual que las de cuerpo).
- **Arte 100% propio** (P2): nunca calcar/redibujar láminas de atlas existentes
  (Richer/Bridgman/anatomy4sculptors); solo se usan sus RATIOS como dato.
- **⚠️ CADA VISTA = ANATOMÍA DISTINTA (regla central):** una parte NO es la misma
  imagen rotada. Cada vista muestra **estructuras de superficie diferentes** y a veces
  **se llama distinto**: mano dorsal (nudillos, tendones extensores) ≠ palmar (eminencias
  tenar/hipotenar, pliegues) ≠ lateral (perfil del pulgar). Rodilla frontal (rótula) ≠
  perfil ≠ **corva/hueco poplíteo** por detrás. El cuerpo entero igual: el torso de frente
  es **pecho/abdomen**, de espalda es **dorsal/lumbar**, de lado es **costado**. Generar
  cada vista pensando QUÉ se ve realmente desde ahí, no rotando la anterior.
- **Default = 3 vistas por parte** (frontal/lateral/posterior) salvo que una vista no
  aporte nada nuevo; varias partes suman vistas propias (mano: dorsal/palmar/lateral;
  pie: dorsal/medial/lateral/plantar; cabeza: +¾). Las filas con 2 vistas son MÍNIMOS a
  ampliar, no el tope.

## Reglas de oro (heredan de las láminas de cuerpo)
1. **Adjuntar** `public/canon/heroic/frontal.png` como referencia de ESTILO (trazo,
   línea, sombreado) — copiar SOLO el estilo, no la escala.
2. **Line-art limpio**: sin texto, números, etiquetas, flechas, grilla ni medidas.
3. **Vista ortográfica** (sin perspectiva ni escorzo), la parte AISLADA (sin el
   resto del cuerpo), recorte ceñido con margen parejo ~3%.
4. **Fondo TRANSPARENTE obligatorio** (PNG alpha real; ni blanco ni damero).
5. Adulto masculino neutro, anatomía realista, MISMA "persona" en todas las vistas
   de una parte (en vistas 2..n adjuntar la primera vista generada de esa parte).

## Plantilla (rellenar PART/VIEW/PROPORTION por la tabla de abajo)
```
Orthographic anatomical study plate of an isolated adult male {PART}, {VIEW} view, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and subtle shading as the attached reference image (copy ONLY the art style, not the subject).

SUBJECT: the {PART} ALONE — isolated, not attached to a body, no other body parts visible. Anatomically accurate, realistic surface anatomy (tendons, knuckles, muscle/bone landmarks where visible). Neutral relaxed anatomical position.

PROPORTION (most important): {PROPORTION}

VIEW: exact {VIEW} view, orthographic (no perspective, no foreshortening, no tilt).

FRAMING: the entire {PART} fully visible, tightly framed with a small even margin (~3%) on all sides, centered. Never crop any portion.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no arrows, no measurement marks, no grid, no color. Output a PNG with a FULLY TRANSPARENT background (alpha channel) — only the {PART} on transparency. High resolution, crisp lines.
```

## Negative prompt (para todas)
```
full body, torso attached, arm attached, extra body parts, background, white background, solid background, gradient, floor, shadow, text, letters, numbers, labels, arrows, measurement lines, ruler, grid, watermark, color, perspective, foreshortening, tilted view, cropped, cut off, multiple objects, duplicate
```

## Tabla por parte (vistas + bloque PROPORTION con fuente)

Ratios = `anatomyParts.ts` (Richer 1890 / Loomis / Bridgman / antropometría).
"cab" = unidades-cabeza del cuerpo entero (solo para coherencia interna del dibujo).

| Parte | Vistas (orden) | PROPORTION para el prompt |
|---|---|---|
| **Mano** `hand/` | dorsal · palmar · lateral | hand length ≈ face length (chin to hairline); palm is about HALF the total hand length, middle finger the other half; palm width ≈ 0.45 of hand length; middle finger longest, then ring, index, little; thumb reaches about half of the index proximal phalanx; phalanges shorten toward the tip (proximal > middle > distal) |
| **Pie** `foot/` | dorsal · medial · lateral · plantar | foot length ≈ one head height (about 1.5× hand length); instep height ≈ 0.3 of foot length at the ankle; widest at the ball ≈ 0.35 of length; big toe largest, toes shorten progressively to the little toe; visible arch on the medial side |
| **Cabeza** `head/` | frontal · lateral · posterior · ¾ | head width ≈ 2/3 of head height, depth ≈ 0.8 of height; eyes exactly at HALF the head height; face divided in equal thirds (hairline→brow, brow→nose base, nose base→chin); ear spans brow line to nose base; mouth width ≈ distance between pupils; eye width ≈ 1/5 of face width |
| **Cuello** `neck/` | frontal · lateral | neck length ≈ 1/3 head height from chin to clavicle; width ≈ half a head width seen from front, deeper than wide in profile (≈ 0.55 head height deep); visible sternocleidomastoid and trapezius slope |
| **Tórax** `torso/` | frontal · lateral · posterior | ribcage block ≈ 1.5 heads wide, ≈ 2 heads tall, ≈ 0.95 head deep; nipples at one head below the chin; clear landmarks: clavicles, sternum, pectorals, rib arch, navel above the iliac crest |
| **Pelvis** `pelvis/` | frontal · lateral · posterior | pelvis block ≈ 1.5–1.7 heads wide, ≈ 0.95 head deep; iliac crest at waist level, pubis at the body's mid-height; male pelvis: narrower than ribcage, gluteal mass behind |
| **Brazo (sup.)** `arm/` | frontal · lateral · posterior | upper arm from acromion to elbow ≈ 1.4 head heights; deltoid wraps the shoulder, biceps/triceps masses visible; elbow at waist/navel level on a full figure |
| **Antebrazo** `forearm/` | anterior · posterior | forearm from elbow to wrist ≈ 1.15 head heights; widest near the elbow (brachioradialis/flexor mass), narrowing to the wrist; wrist ends at crotch level on a full figure |
| **Muslo** `thigh/` | frontal · lateral · posterior | thigh from hip joint to knee ≈ 2 head heights; quadriceps mass forward, hamstring behind; widest at upper third |
| **Pierna (inf.)** `leg/` | frontal · lateral · posterior | lower leg from knee to ankle ≈ 1.7 head heights; calf (gastrocnemius) widest at upper third, inner ankle higher than outer |

### Partes NUEVAS (atlas ampliado — `plan-canon-hover-vistas-partes.md`; ratios CANDIDATOS, confirmar en N1)

| Parte | Carpeta | Vistas (orden) | PROPORTION para el prompt |
|---|---|---|---|
| **Hombro/deltoides** | `shoulder/` | frontal · lateral · posterior | deltoid caps the shoulder like an inverted teardrop wrapping the humeral head; spans from the outer third of the clavicle and the scapular spine down to its insertion about halfway down the upper arm; its mass defines the body's widest line (biacromial) |
| **Trapecio** | `trapezius/` | posterior · lateral | kite-shaped muscle from the base of the skull to mid-back, spreading to both acromions; the neck-to-shoulder slope it forms descends smoothly from the neck base to the acromion; upper fibers visible from the front as the neck slope |
| **Codo** | `elbow/` | anterior · posterior · lateral | elbow joint region: biepicondylar width ≈ one third of a head height; olecranon prominent at the back when extended; cubital crease in front; sits at waist/navel level on a standing figure |
| **Muñeca** | `wrist/` | dorsal · palmar · lateral | wrist: bistyloid width ≈ one quarter of a head height, clearly NARROWER than the forearm and flatter than tall (wider than deep); ulnar styloid bump visible on the little-finger side; sits at crotch level on a standing figure |
| **Glúteos** | `gluteus/` | posterior · lateral | gluteal mass from the iliac crest to the gluteal fold spans roughly one head height; the fold marks its lower border; in profile the buttock projects clearly behind the line of the back and thigh |
| **Rodilla** | `knee/` | frontal · lateral · posterior | knee region: bicondylar width ≈ 0.4 of a head height; patella sits centered above the joint line, framed by the vastus medialis tear-drop on the inner side; back of the knee shows the popliteal crease between hamstring tendons; kneecap sits just below 2/3 of total body height |
| **Tobillo** | `ankle/` | frontal · medial · lateral · posterior | ankle: bimalleolar width ≈ 0.3 of a head height; the INNER malleolus (tibia) sits HIGHER and more forward than the outer malleolus (fibula) — the asymmetry every atlas insists on; Achilles tendon narrows the silhouette just above the heel |

### Ejemplo armado (Mano · dorsal — la primera a generar)
```
Orthographic anatomical study plate of an isolated adult male HAND, DORSAL (back of the hand) view, fingers together and gently extended, thumb relaxed at its natural angle, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and subtle shading as the attached reference image (copy ONLY the art style, not the subject).

SUBJECT: the HAND ALONE — isolated at the wrist, not attached to an arm, no other body parts. Anatomically accurate: visible extensor tendons, knuckles, nail shapes, skin creases at joints.

PROPORTION (most important): palm is about HALF the total hand length and the middle finger the other half; palm width ≈ 0.45 of hand length; middle finger longest, then ring, then index, then little finger; thumb tip reaches about the middle of the index proximal phalanx; each finger's phalanges shorten toward the tip (proximal > middle > distal).

VIEW: exact dorsal view, orthographic (no perspective, no foreshortening, no tilt), hand vertical with fingers pointing up.

FRAMING: the entire hand from wrist crease to middle fingertip fully visible, tightly framed with a small even margin (~3%) on all sides, centered.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no arrows, no measurement marks, no grid, no color. Output a PNG with a FULLY TRANSPARENT background (alpha channel) — only the hand on transparency. High resolution, crisp lines.
```

### Regiones de SUPERFICIE por vista (no son segmentos óseos — son zonas de piel/músculo)

Estas regiones existen SOLO en su(s) vista(s): el torso de frente es pecho/abdomen, de
espalda es dorsal/lumbar, de lado es costado. Cada una es su propia lámina. (Carpetas se
crean al primer asset.) Ratios a confirmar con fuente como el resto.

| Región | Carpeta | Vista(s) donde existe | PROPORTION / qué se ve |
|---|---|---|---|
| **Pecho** | `chest/` | frontal | pectorales, esternón, línea de pezones a 1 cabeza del mentón; ancho ≈ caja torácica 1.5 cab |
| **Abdomen** | `abdomen/` | frontal · lateral | recto abdominal (tableta), ombligo sobre la mitad del cuerpo; de lado, la curva del oblicuo |
| **Costado / flanco** | `flank/` | lateral | costillas inferiores + oblicuo + borde del dorsal ancho; del axila a la cresta ilíaca |
| **Cadera** | `hip/` | lateral · posterior | trocánter mayor como punto óseo; transición glúteo↔muslo |
| **Espalda alta / dorsal** | `back/` | posterior | trapecio medio/inferior + dorsal ancho + escápulas; ancho de hombros arriba, estrecha a la cintura |
| **Lumbar** | `lumbar/` | posterior | erectores espinales flanqueando el surco, rombo de Michaelis sobre el sacro |
| **Glúteos** | `glutes/` | posterior · lateral | masa glútea de la cresta ilíaca al pliegue ≈ 1 cabeza; de lado proyecta tras la línea de la espalda |
| **Muslo posterior (isquiotibiales)** | `hamstring/` | posterior | bíceps femoral + semitendinoso, surco central; del pliegue glúteo a la corva |
| **Corva / hueco poplíteo** | `popliteal/` | posterior | rombo detrás de la rodilla entre los tendones isquiotibiales y los gemelos |
| **Pantorrilla (gemelos)** | `calf/` | posterior · lateral | gastrocnemio de doble vientre, punto más ancho en el tercio superior, afina al Aquiles |
| **Nuca** | `nape/` | posterior | inserción del trapecio en el cráneo, séptima cervical prominente al inclinar |
| **Talón** | `heel/` | posterior · lateral | calcáneo + tendón de Aquiles estrechándose sobre el talón |

> Estas alimentan el **region-set por vista** del modelo interactivo
> (`plan-canon-hover-vistas-partes.md` §"Regiones por vista"). Misma plantilla de prompt;
> sustituir {PART}/{VIEW}/{PROPORTION} por la fila. Recordar el negative prompt para
> evitar que aparezca el cuerpo entero.

### Ejemplo armado (Rodilla · frontal — primera articulación a generar)
```
Orthographic anatomical study plate of an isolated adult male KNEE region (from lower thigh to upper shin), FRONTAL view, leg straight and relaxed, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and subtle shading as the attached reference image (copy ONLY the art style, not the subject).

SUBJECT: the KNEE region ALONE — isolated segment cut cleanly at lower thigh above and upper shin below, no full leg, no other body parts. Anatomically accurate surface anatomy: patella (kneecap) centered above the joint line, the tear-drop bulge of the vastus medialis on the inner side, patellar tendon descending to the tibial tuberosity, subtle condyle contours.

PROPORTION (most important): bicondylar width ≈ 0.4 of a head height; the patella reads as a rounded square about a quarter of the region's width; inner contour fuller than the outer.

VIEW: exact frontal view, orthographic (no perspective, no foreshortening, no tilt), leg vertical.

FRAMING: the whole region fully visible, tightly framed with a small even margin (~3%) on all sides, centered; the cut ends fade out cleanly (no hard amputation lines).

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no arrows, no measurement marks, no grid, no color. Output a PNG with a FULLY TRANSPARENT background (alpha channel) — only the knee region on transparency. High resolution, crisp lines.
```

> Para las demás articulaciones (codo/muñeca/tobillo) usar la MISMA estructura:
> segmento aislado con cortes desvanecidos + el bloque PROPORTION de su fila.

## Flujo (al tener una lámina — `plan-canon-laminas-faltantes.md` §4.5.4)
1. Verifico alpha real + recorto bbox si trae padding.
2. Mido las cotas (px → fracción) para que A6 dibuje las dimensiones donde van.
3. Cableo `anatomyParts.ts` → `image[view] = '/canon/parts/<part>/<view>.png'`.
4. La ficha (A4) deja el fallback de zoom y muestra la lámina real.
