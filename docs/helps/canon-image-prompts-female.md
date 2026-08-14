# Prompts para generar las láminas de Canon FEMENINO (IA)

Segundo eje del sistema: la **figura femenina adulta**. Misma lógica que el masculino
(`canon-image-prompts.md`), pero con landmarks anatómicos propios. Se generan en el
**mismo estilo y encuadre** que la heroica masculina (solo como referencia de TRAZO),
con máxima **fidelidad anatómica femenina**, para luego medir si las proporciones coinciden.

- Eje paralelo al masculino: **academic-f (7.5) · heroic-f (8) · comic-f (8.5)**.
- Carpetas destino: `public/canon/academic-female/`, `heroic-female/`, `comic-female/`.
- Orden de vistas: **frontal → lateral → posterior**.

> **Lecciones de producción** (de las 9 masculinas + trazado A3, detalle en
> `canon-image-prompts.md`): verificar **alpha real**; en lateral/posterior exigir
> **mismas alturas Y** que el frontal adjunto; pedir **hueco visible brazo-torso
> (axila→muñeca) y mano-muslo** — facilita medir anchos y trazar las regiones
> clicables (`partHits.ts`); la verdad final es la **medición**, no el prompt (P10).

## Reglas de oro (no cambian)
1. **Adjuntar** `public/canon/heroic/frontal.png` como **referencia de ESTILO** (line-art, trazo, sombreado) SOLO en los **frontales**. ⚠️ Esa imagen es un **hombre heroico de 8 cabezas** — la IA debe copiar SOLO el estilo de trazo, **NUNCA su sexo, su proporción ni su nº de cabezas**. El sexo (femenino) y la proporción los manda el bloque de cada prompt. En **lateral y posterior** se adjunta el **frontal femenino ya generado** de ese mismo canon (ver cada sección).
2. **Line-art limpio**: sin texto, números, etiquetas, grilla, líneas de división ni medidas (la interfaz la dibuja la app encima).
3. **Encuadre completo, sin recortes**: la figura ENTERA visible — toda la cabeza (incluido el pelo) y todos los pies (dedos y talón) dentro del cuadro, con un **margen pequeño y parejo (~3%) arriba y abajo**. Nunca cortar ninguna parte. Centrada vertical y horizontalmente. (Yo mido los bordes reales del cuerpo para el mapeo `frac`, así que el margen no estorba; lo que rompe es que recorte cabeza o pies.)
4. **Vista ortográfica** (sin perspectiva), pose simétrica, misma persona/estilo en las tres vistas de un mismo canon.
5. **Fondo TRANSPARENTE obligatorio**: PNG con canal alpha, SIN fondo de ningún tipo (ni blanco, ni gris, ni degradado). Solo la figura sobre transparencia. Aspecto vertical ~2:7, alta resolución.

## Landmarks femeninos (clave para que NO salga como hombre)
La proporción en cabezas fija la ALTURA; lo que define el sexo son los **landmarks**. En todos los prompts de abajo se insiste en:
- **Hombros más estrechos** (~1.5 cabezas de ancho, no ~2).
- **Cintura más marcada y más alta** que en el hombre.
- **Caderas anchas**: ancho de cadera ≈ ancho de hombros o mayor (silueta de reloj de arena).
- **Pecho** a la altura de la 2.ª cabeza, busto femenino natural.
- **Ombligo** ligeramente por encima de la media del cuerpo.
- **Pelvis ancha**, ángulo del muslo más pronunciado hacia la rodilla.
- Musculatura suave/naturalista, NO masculina ni hipertrofiada.

Cuando tengas una lámina, pásala → mido `frac` reales + dims, comparo contra el canon geométrico (Δ) y la agrego al sistema.

---

# ACADEMIC FEMALE — 7.5 cabezas

### Frontal  (adjuntar: `public/canon/heroic/frontal.png` como ref de ESTILO)
```
Front-view anatomical proportion plate of a standing adult FEMALE figure, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference image. NOTE: the attached reference is an 8-heads HEROIC MALE figure — copy ONLY its line/art style, do NOT copy its sex, its proportions or its head count. The figure you draw is FEMALE and uses the head count specified below.

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. CLASSICAL ACADEMIC female canon (life-study, naturalistic), NOT idealized fashion or comic. FEMALE anatomy: shoulders relatively narrow (about 1.5 heads wide), clearly defined waist set HIGH, wide hips (hip width about equal to or greater than shoulder width, hourglass silhouette), natural female breasts at the 2nd head level, navel slightly above mid-body, broad pelvis, soft naturalistic musculature (never male or muscular). Natural landmarks (chin, clavicles, bust, waist, navel, iliac crest, pubis near mid-body, knees, calves, ankles) placed where real female academic life-drawing puts them for 7.5 heads.

POSE: relaxed symmetric standing, frontal orthographic view (no perspective, no foreshortening), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, palms forward, hands NOT touching the thighs (small gap), legs together, even weight, looking straight ahead, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio about 2:7.

STYLE: clean uninterrupted contour lines, light anatomical construction lines only, no text, no labels, no numbers, no measurement marks, no grid, no division lines, no ruler, no scenery, no ground shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind (no white, no gray, no gradient), only the figure on transparency. High resolution, crisp vector-like lines.
```

### Lateral (perfil)  (adjuntar: el frontal academic-female ya generado)
```
Side profile (lateral) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the ACADEMIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the side view of that same plate.

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. Classical academic FEMALE canon (naturalistic, NOT fashion or comic). FEMALE side view: high waist, rounded bust and buttock profile, broad pelvis, soft musculature. Vertical landmark heights (chin, shoulder, bust line, waist, navel, pubis, knee, calf, ankle) identical to the attached front view.

POSE: relaxed symmetric standing seen from the exact side (90° profile), orthographic (no perspective), arms hanging naturally at the side, legs together, looking straight ahead.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

### Posterior (espalda)  (adjuntar: el frontal academic-female ya generado)
```
Back view (posterior) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the ACADEMIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the back view of that same plate.

PROPORTION (most important): figure is EXACTLY 7.5 heads tall — head height (crown to chin) equals 1/7.5 of total body height. Classical academic FEMALE canon (naturalistic). FEMALE back view: narrow shoulders, marked waist, wide hips, rounded gluteal contour. Vertical landmark heights (nape, shoulder line, scapulae, waist, lower back, gluteal fold, knee crease, calf, ankle) consistent with the attached front view.

POSE: relaxed symmetric standing seen exactly from behind, frontal-flat orthographic (no perspective), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, hands NOT touching the thighs (small gap), legs together, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

---

# HEROIC FEMALE — 8 cabezas

### Frontal  (adjuntar: `public/canon/heroic/frontal.png` como ref de ESTILO)
```
Front-view anatomical proportion plate of a standing adult FEMALE figure, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference image. NOTE: the attached reference is an 8-heads HEROIC MALE figure — copy ONLY its line/art style, do NOT copy its sex. The figure you draw is FEMALE.

PROPORTION (most important): figure is EXACTLY 8 heads tall — head height (crown to chin) equals 1/8 of total body height. IDEALIZED HEROIC female canon (classical/Renaissance ideal, like a Greek goddess figure), elegant and balanced, NOT a comic or fashion exaggeration. FEMALE anatomy: narrow shoulders (about 1.5–1.7 heads), high defined waist, wide hips forming a graceful hourglass, natural female breasts at the 2nd head level, navel near mid-body, broad pelvis, smooth idealized musculature. Natural landmarks (chin, clavicles, bust, waist, navel, iliac crest, pubis, knees, calves, ankles) placed consistently for 8 heads.

POSE: relaxed symmetric standing, frontal orthographic view (no perspective, no foreshortening), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, palms forward, hands NOT touching the thighs (small gap), legs together, even weight, looking straight ahead, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio about 2:7.

STYLE: clean uninterrupted contour lines, light anatomical construction lines only, no text, no labels, no numbers, no measurement marks, no grid, no division lines, no ruler, no scenery, no ground shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind (no white, no gray, no gradient), only the figure on transparency. High resolution, crisp vector-like lines.
```

### Lateral (perfil)  (adjuntar: el frontal heroic-female ya generado)
```
Side profile (lateral) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the HEROIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the side view of that same plate.

PROPORTION (most important): figure is EXACTLY 8 heads tall — head height (crown to chin) equals 1/8 of total body height. Idealized heroic FEMALE canon. FEMALE side view: high waist, rounded bust and buttock profile, broad pelvis, smooth idealized musculature. Vertical landmark heights (chin, shoulder, bust line, waist, navel, pubis, knee, calf, ankle) identical to the attached front view.

POSE: relaxed symmetric standing seen from the exact side (90° profile), orthographic (no perspective), arms hanging naturally at the side, legs together, looking straight ahead.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

### Posterior (espalda)  (adjuntar: el frontal heroic-female ya generado)
```
Back view (posterior) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the HEROIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the back view of that same plate.

PROPORTION (most important): figure is EXACTLY 8 heads tall — head height (crown to chin) equals 1/8 of total body height. Idealized heroic FEMALE canon. FEMALE back view: narrow shoulders, marked waist, wide hips, rounded gluteal contour. Vertical landmark heights (nape, shoulder line, scapulae, waist, lower back, gluteal fold, knee crease, calf, ankle) consistent with the attached front view.

POSE: relaxed symmetric standing seen exactly from behind, frontal-flat orthographic (no perspective), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, hands NOT touching the thighs (small gap), legs together, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

---

# COMIC FEMALE — 8.5 cabezas

### Frontal  (adjuntar: `public/canon/heroic/frontal.png` como ref de ESTILO)
```
Front-view anatomical proportion plate of a standing stylized comic-book FEMALE hero figure, clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference image. NOTE: the attached reference is an 8-heads HEROIC MALE figure — copy ONLY its line/art style, do NOT copy its sex. The figure you draw is FEMALE.

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height (crown to chin) equals 1/8.5 of total body height (small head, very long legs, idealized comic proportions). Comic/stylized FEMALE canon, still anatomically coherent. FEMALE anatomy: narrow shoulders, very high and tightly defined waist, wide hips, dramatic hourglass silhouette, natural female breasts at the 2nd head level, long legs, smooth stylized musculature. Natural landmarks (chin, clavicles, bust, waist, navel, iliac crest, pubis, knees, calves, ankles) placed consistently for 8.5 heads.

POSE: relaxed symmetric standing, frontal orthographic view (no perspective, no foreshortening), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, palms forward, hands NOT touching the thighs (small gap), legs together, even weight, looking straight ahead, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio about 2:7.

STYLE: clean uninterrupted contour lines, light anatomical construction lines only, no text, no labels, no numbers, no measurement marks, no grid, no division lines, no ruler, no scenery, no ground shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind (no white, no gray, no gradient), only the figure on transparency. High resolution, crisp vector-like lines.
```

### Lateral (perfil)  (adjuntar: el frontal comic-female ya generado)
```
Side profile (lateral) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the COMIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the side view of that same plate.

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height (crown to chin) equals 1/8.5 of total body height. Comic/stylized FEMALE canon. FEMALE side view: very high waist, rounded bust and buttock profile, long legs, smooth stylized musculature. Vertical landmark heights (chin, shoulder, bust line, waist, navel, pubis, knee, calf, ankle) identical to the attached front view.

POSE: relaxed symmetric standing seen from the exact side (90° profile), orthographic (no perspective), arms hanging naturally at the side, legs together, looking straight ahead.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

### Posterior (espalda)  (adjuntar: el frontal comic-female ya generado)
```
Back view (posterior) anatomical proportion plate of the SAME FEMALE figure shown in the attached reference image, which is the COMIC FEMALE FRONT view of this exact figure. Clean black line art on a FULLY TRANSPARENT background (PNG with alpha, no background at all), same drawing style, line weight and shading as the attached reference. Match the attached front view EXACTLY: same woman, same head size, same total height, same vertical landmark heights — this is the back view of that same plate.

PROPORTION (most important): figure is EXACTLY 8.5 heads tall — head height (crown to chin) equals 1/8.5 of total body height. Comic/stylized FEMALE canon. FEMALE back view: narrow shoulders, very marked waist, wide hips, rounded gluteal contour, long legs. Vertical landmark heights (nape, shoulder line, scapulae, waist, lower back, gluteal fold, knee crease, calf, ankle) consistent with the attached front view.

POSE: relaxed symmetric standing seen exactly from behind, frontal-flat orthographic (no perspective), arms slightly away from the torso with a CLEAR VISIBLE GAP between each arm and the torso from the armpit down to the wrist, hands NOT touching the thighs (small gap), legs together, bilaterally symmetric.

FRAMING: the ENTIRE figure must be fully visible and NOT cropped — the whole head INCLUDING the top of the hair, and the whole feet INCLUDING toes and heels, are completely inside the frame, with a small even margin (about 3% of the height) above the head and below the feet. NEVER crop or cut off any body part. Vertically and horizontally centered, tall portrait aspect ratio.

STYLE: clean uninterrupted contour lines, light construction lines only, no text, no labels, no numbers, no grid, no measurement marks, no scenery, no shadow, no color. VERY IMPORTANT: output a PNG with a FULLY TRANSPARENT background (alpha channel) — absolutely NO background of any kind, only the figure on transparency. High resolution.
```

---

# Negative prompt (para todas)
```
male figure, masculine body, broad male shoulders, flat chest, muscular male torso, background, white background, solid background, opaque background, gray background, gradient background, colored backdrop, floor, scenery, cast shadow, text, letters, numbers, labels, captions, grid, ruler, measurement lines, division marks, watermark, signature, color, painterly shading, perspective, foreshortening, tilted pose, cropped head, cropped feet, cut off head, cut off feet, cropped limbs, partial body, zoomed in, extra limbs, multiple figures
```

# Flujo
1. Generar **frontal** de cada canon femenino (academic-f primero), adjuntando `heroic/frontal.png` como ref de estilo.
2. Pasarme la imagen → mido `frac`/dims, comparo Δ vs canon geométrico, la coloco en `public/canon/<id>-female/frontal.png`.
3. Generar **lateral** y **posterior** adjuntando el frontal femenino recién hecho de ese canon.
4. Cuando un canon tenga sus 3 vistas, aparece solo en el selector y el comparador.
