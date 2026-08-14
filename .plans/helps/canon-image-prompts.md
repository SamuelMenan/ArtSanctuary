---
title: "Prompts de generación — láminas Canon (masculino)"
audience: non-technical
status: reference
updated: 2026-08-14
owner: TBD
---

# Prompts para generar las láminas de Canon (IA)

Generar láminas en el **mismo estilo y encuadre** que la heroica, con máxima
**fidelidad anatómica**, para luego medir si las proporciones coinciden.

- **Estado (2026-06-09):** los 3 cánones masculinos YA tienen sus 3 láminas
  (`academic`, `heroic`, `comic`). Este doc queda como **plantilla probada** para
  regenerar una lámina o derivar nuevas (femeninas → `canon-image-prompts-female.md`,
  partes → `canon-image-prompts-parts.md`, overlays → §Overlays abajo).
- Orden de vistas: **frontal → lateral → posterior**.

## Lecciones de producción (de las 9 masculinas + trazado A3)
- **Alpha real**: algunos generadores devuelven "transparencia" pintada (damero o
  blanco). Verificar el canal alpha; si trae padding, se recorta a bbox (pipeline probado).
- **Mismas alturas Y entre vistas**: las 3 vistas de un canon COMPARTEN los `frac`
  medidos → en lateral/posterior SIEMPRE adjuntar el frontal de ese mismo canon y
  exigir "same vertical landmark heights". Si no calzan, la lámina se rehace.
- **Separación brazo-torso y mano-muslo (nuevo, por A3)**: el trazado de regiones
  clicables y la medición de anchos funcionan MUCHO mejor si hay un **hueco visible
  entre el brazo y el torso desde la axila hasta la muñeca**, y entre **las manos y
  los muslos**. En la heroica actual el brazo va pegado hasta media cintura y hubo
  que separar por geometría. Los prompts de abajo ya lo piden.
- **Lateral es estrecho**: ~la mitad del ancho del frontal; no forzar el mismo aspect.
- La proporción REAL del dibujo casi nunca es exacta al canon pedido — por eso se
  MIDE (`frac`) y la verdad es la medición, no el prompt (P10).

## Reglas de oro (no cambian)
1. **Adjuntar** `public/canon/heroic/frontal.png` como **referencia de ESTILO** (line-art, trazo, sombreado). ⚠️ Esa imagen es de **8 cabezas (heroico)** — la IA debe copiar SOLO el estilo, **NUNCA su proporción ni su nº de cabezas**. La proporción la manda el bloque PROPORTION de cada prompt.
2. **Line-art limpio**: sin texto, números, etiquetas, grilla, líneas de división ni medidas (la interfaz la dibuja la app encima).
3. **Encuadre completo, sin recortes**: la figura ENTERA visible — toda la cabeza (incluido el pelo) y todos los pies (dedos y talón) dentro del cuadro, con un **margen pequeño y parejo (~3%) arriba y abajo**. Nunca cortar ninguna parte. Centrada vertical y horizontalmente. (Yo mido los bordes reales del cuerpo para el mapeo `frac`, así que el margen no estorba; lo que rompe es que recorte cabeza o pies.)
4. **Vista ortográfica** (sin perspectiva), pose simétrica, misma persona/estilo en todas.
5. **Fondo TRANSPARENTE obligatorio**: PNG con canal alpha, SIN fondo de ningún tipo (ni blanco, ni gris, ni degradado). Solo la figura sobre transparencia. Aspecto vertical ~2:7, alta resolución.

Cuando tengas una lámina, pásala → mido `frac` reales + dims, comparo contra el canon geométrico (Δ) y la agrego al sistema.

---

# ACADEMIC — 7.5 cabezas

### Frontal
```
Front-view anatomical proportion plate of a standing adult male figure, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference image. NOTE: the attached reference is an 8-heads HEROIC figure — copy ONLY its line/art style, do NOT copy its proportions or head count (use the head count specified below).

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. Classical academic canon. Anatomically accurate, realistic musculature, natural landmarks (chin, clavicles, nipples, navel, iliac crest, pubis near mid-body, knees, calves, ankles) placed where real human anatomy puts them for this head count.

POSE: relaxed symmetric standing, frontal orthographic view (no perspective, no foreshortening), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, palms forward, hands NOT touching the thighs (small gap), legs together, even weight, looking straight ahead, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio about 2:7.

STYLE: clean uninterrupted contour lines, light anatomical construction lines only, no text, no labels, no numbers, no measurement marks, no grid, no division lines, no ruler, no scenery, no ground shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind (no white, no gray, no gradient), only the figure on transparency. High resolution, crisp vector-like lines.
```

### Lateral (perfil)
```
Side profile (lateral) anatomical proportion plate of the SAME figure shown in the attached reference image, which is the ACADEMIC FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same person, same head size, same total height, same vertical landmark heights — this is the side view of that same plate.

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. Classical academic canon. Anatomically accurate side view; vertical landmark heights (chin, shoulder, nipple line, navel, pubis, knee, calf, ankle) identical to the attached front view.

POSE: relaxed symmetric standing seen from the exact side (90° profile), orthographic (no perspective), arms hanging naturally at the side, legs together, looking straight ahead.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

### Posterior (espalda)
```
Back view (posterior) anatomical proportion plate of the SAME figure shown in the attached reference image, which is the ACADEMIC FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same person, same head size, same total height, same vertical landmark heights — this is the back view of that same plate.

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. Classical academic canon. Anatomically accurate back view; vertical landmark heights (nape, shoulder line, scapulae, lower back, gluteal fold, knee crease, calf, ankle) consistent with the attached front view.

POSE: relaxed symmetric standing seen exactly from behind, frontal-flat orthographic (no perspective), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, hands NOT touching the thighs (small gap), legs together, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

---

# COMIC — 8.5 cabezas

### Frontal
```
Front-view anatomical proportion plate of a standing stylized comic-book male hero figure, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference image. NOTE: the attached reference is an 8-heads HEROIC figure — copy ONLY its line/art style, do NOT copy its proportions or head count (use the head count specified below).

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height (crown to chin) equals 1/8.5 of total body height (small head, very long legs, idealized comic proportions). Comic/stylized canon. Still anatomically coherent, natural landmarks (chin, clavicles, nipples, navel, iliac crest, pubis, knees, calves, ankles) placed consistently for this head count.

POSE: relaxed symmetric standing, frontal orthographic view (no perspective, no foreshortening), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, palms forward, hands NOT touching the thighs (small gap), legs together, even weight, looking straight ahead, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light anatomical construction lines only, no text, no labels, no numbers, no measurement marks, no grid, no division lines, no ruler, no scenery, no ground shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind (no white, no gray, no gradient), only the figure on transparency. High resolution, crisp vector-like lines.
```

### Lateral (perfil)
```
Side profile (lateral) anatomical proportion plate of the SAME figure shown in the attached reference image, which is the COMIC FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same person, same head size, same total height, same vertical landmark heights — this is the side view of that same plate.

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height equals 1/8.5 of total body height. Comic/stylized canon. Anatomically coherent side view; vertical landmark heights (chin, shoulder, nipple line, navel, pubis, knee, calf, ankle) identical to the attached front view.

POSE: relaxed symmetric standing seen from the exact side (90° profile), orthographic, arms hanging naturally at the side, legs together, looking straight ahead.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

### Posterior (espalda)
```
Back view (posterior) anatomical proportion plate of the SAME figure shown in the attached reference image, which is the COMIC FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same person, same head size, same total height, same vertical landmark heights — this is the back view of that same plate.

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height equals 1/8.5 of total body height. Comic/stylized canon. Anatomically coherent back view; vertical landmark heights (nape, shoulder line, scapulae, lower back, gluteal fold, knee crease, calf, ankle) consistent with the attached front view.

POSE: relaxed symmetric standing seen exactly from behind, orthographic, arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, hands NOT touching the thighs (small gap), legs together, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

---

# OVERLAYS — esqueleto / músculos (Bloque B de `plan-canon-laminas-faltantes.md`)

Capas que se superponen a la lámina base (`skeleton-<view>.png`, `muscles-<view>.png`
en `public/canon/<id>/overlays/`). **El requisito que manda es el REGISTRO**: el
overlay se dibuja DENTRO de la silueta exacta de la lámina base, con el MISMO
recorte/bbox (la app lo pinta con `fill object-contain` encima → debe calzar pixel
a pixel). Prioridad: skeleton-frontal + muscles-frontal de cada canon (mínimo útil).

### Skeleton (adjuntar: la lámina base de ESE canon-vista, p. ej. `heroic/frontal.png`)
```
Anatomical SKELETON overlay plate for the attached reference figure. Draw the complete human skeleton in clean black line art, positioned EXACTLY INSIDE the body silhouette of the attached figure: same pose, same view, same scale, same framing and crop as the attached image — every bone must sit where it sits inside that exact body (skull inside the head, ribcage inside the chest, pelvis at the hips, limb bones along the limbs, hands and feet bones inside hands and feet).

REGISTRATION (most important): the output canvas matches the attached image exactly — same aspect ratio, the skeleton's crown-to-soles span equals the figure's crown-to-soles span, nothing shifted or rescaled. If both images were stacked, the skeleton would fit perfectly inside the body outline.

CONTENT: skeleton ONLY — do NOT draw the body outline, do NOT draw skin contour, muscles or clothing. Clean medical-illustration line art, anatomically accurate adult skeleton.

STYLE: clean black lines matching the attached drawing style, no text, no labels, no numbers, no grid, no color. Output a PNG with a FULLY TRANSPARENT background — only the skeleton lines on transparency. High resolution.
```

### Muscles (adjuntar: la lámina base de ESE canon-vista)
```
Anatomical MUSCLES (écorché) overlay plate for the attached reference figure. Draw the superficial muscle layer in clean black line art, positioned EXACTLY INSIDE the body silhouette of the attached figure: same pose, same view, same scale, same framing and crop as the attached image — every muscle must sit where it sits on that exact body (pectorals, deltoids, biceps, abdominals, quadriceps, calves, etc.).

REGISTRATION (most important): the output canvas matches the attached image exactly — same aspect ratio, crown-to-soles span identical, nothing shifted or rescaled. Stacked on the attached image, the écorché fits perfectly inside the body outline.

CONTENT: muscle layer ONLY — do NOT repeat the outer skin contour beyond what the muscles define, no skeleton, no clothing. Clean écorché medical-illustration line art, anatomically accurate.

STYLE: clean black lines matching the attached drawing style, no text, no labels, no numbers, no grid, no color. Output a PNG with a FULLY TRANSPARENT background — only the muscle lines on transparency. High resolution.
```

**Al tener un overlay:** verificar registro superponiéndolo a la base (mismo bbox);
colocar en `public/canon/<id>/overlays/<layer>-<view>.png` y listar la vista en
`OVERLAY_ASSETS` (`lib/overlays.ts`) → el toggle se prende solo.

---

# Negative prompt (para todas)
```
background, white background, solid background, opaque background, gray background, gradient background, colored backdrop, floor, scenery, cast shadow, text, letters, numbers, labels, captions, grid, ruler, measurement lines, division marks, watermark, signature, color, painterly shading, perspective, foreshortening, tilted pose, cropped head, cropped feet, cut off head, cut off feet, cropped limbs, partial body, zoomed in, extra limbs, multiple figures
```

# Flujo (probado con las 9 masculinas)
1. Generar **frontal** del canon (adjuntando la ref de estilo).
2. Pasarme la imagen → verifico alpha + recorto bbox si hace falta, mido `frac`/dims,
   comparo Δ vs canon geométrico, la coloco en `public/canon/<id>/frontal.png`.
3. Repetir **lateral** y **posterior** adjuntando el frontal recién hecho.
4. Cuando un canon tenga sus 3 vistas, aparece solo en el selector y el comparador.
5. (Después, opcional) trazo las regiones clicables de esa lámina (`partHits.ts`,
   pipeline A3) y mido joints (`CANON_JOINTS`) — sin generar nada nuevo.
