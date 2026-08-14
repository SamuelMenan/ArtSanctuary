---
id: 0010
title: Mapa de músculos clicables del Canon (clasificación por píxel, no cajas)
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0010 — Mapa de músculos clicables del FRONTAL (de cajas a clasificación por píxel)

**Fecha:** 18 de Junio de 2026 · **Umbrella:** `importantes/canon`
**Arquitectura final:** `docs/architecture/canon-muscle-mapping.md`

## El Problema Original

La herramienta Canon muestra una **lámina raster** del cuerpo (render sombreado, no vectorizable).
Se quería que cada músculo fuera **clicable y se iluminara siguiendo su CONTORNO real** — pasar el
ratón sobre "el deltoides" y verlo brillar con **su forma**, no con un rectángulo. Esto exige
**un `path` SVG por músculo y por vista** que siga el contorno, sin huecos, sin solapes, simétrico,
y fiel al mapa muscular que el usuario quería.

La vista **FRONTAL** fue, con diferencia, la más dura: ~6 generaciones de enfoque fracasaron antes
de converger. Esta es la línea histórica de cada intento y por qué cayó. La posterior, en cambio,
salió a la primera con el pipeline de color (gen ② de la arquitectura) porque venía con un écorché
limpio; el drama fue todo del frontal.

---

## Intento 0: Cajas rectangulares (la V2) — el pecado original

**Hipótesis:** zonas clicables = rectángulos sobre cada parte. Hit-test trivial, cero geometría.
**Resultado:** **Fallo de calidad rotundo.** Un cuadrado iluminándose sobre un brazo curvo se ve
roto y barato. De aquí nació la **decisión P9** (`arquitectura.md` §8.1): *forma anatómica, NUNCA
cajas* — vale para el hit-test, el resaltado y el spotlight. Toda solución posterior arrastra esta
regla como restricción dura.

---

## Intento 1: Pipeline geométrico por *runs* (A3) — funciona, pero solo en lo simétrico

**Hipótesis:** sacar la silueta por flood-fill, leer los *runs* `[x0,x1]` por fila, y **cortar**
el cuerpo en partes usando **fracciones de altura ancladas a landmarks** (`extract-runs.ps1` →
`build-polys.js` → `draw-verify.ps1`). Las articulaciones (codo/rodilla) se anclan a un landmark;
los brazos pegados al torso se resuelven con `mirror:"auto"` + `symmetricTrunk`.
**Resultado:** **Éxito para vistas simétricas sin color** (base de posterior/lateral V1). PERO solo
sabe cortar por **altura/silueta**: no distingue músculos que comparten la misma franja horizontal
(pectoral vs deltoides vs trapecio están a la misma altura). Para un **mapa muscular** de frente,
cortar por bandas no alcanza. Sigue vivo como generador ① para láminas sin color.

---

## Intento 2: `build-frontal.js` — generador de vértices compartidos + espejo (F1–F6)

**Hipótesis:** definir un **esqueleto de bordes**: cada borde existe **una sola vez** y las regiones
se arman encadenando bordes → imposible hueco/solape entre vecinos *por construcción*. Medir solo el
lado izquierdo y **espejar** (`x→1-x`) → simetría perfecta. Render `--pure` (rellenos opacos =
detectar huecos) y `--over` (overlay = alineación).
**Resultado:** **La topología funcionó** (sin huecos, simétrico) pero los bordes salían **rectos**.
El generador **no ve las líneas del músculo** → todo parecía cajas con esquinas. Cada coordenada
había que adivinarla a ojo, región por región (el peor corte fue la **pelvis**). No convergía:
sesiones enteras de nudging milimétrico.

---

## Intento 3: F7 — inyectar curvas del écorché en el generador (híbrido)

**Hipótesis:** mantener la topología de vértices compartidos PERO sustituir los bordes internos
rectos por **curvas** (`curve(a,b,bow,n)` → muchos `L`, porque `partHits` solo admite `M/L/Z`),
moldeadas copiando la forma del écorché `referenciafrontal.png` (cap deltoideo redondeado, borde
inferior del pectoral convexo, pliegue inguinal cóncavo, lente de rodilla…).
**Resultado:** **Mejoró, pero seguía sin converger.** Copiar curvas a mano de un écorché a otra
silueta reintroducía desalineación y asimetrías. El feedback del usuario fue claro: *posterior se
ve orgánico porque viene del écorché a color; frontal se hizo 100% con un generador que no ve el
músculo.* La conclusión: **no generar — trazar del material real.**

---

## Intento 4: Warp / trace-por-blob del dibujo del usuario

**Hipótesis:** el usuario entregó `musculos.png` (el mapa coloreado EXACTO que quiere). Trazarlo
directo por **color**: componentes conexos por bucket de color (como el pipeline de posterior, gen ②).
Si la silueta del dibujo no calza con `frontal.png`, **warpear** el dibujo a la silueta de frontal.
**Resultado:** **Doble fracaso medido.**
1. **El warp dejaba huecos:** `musculos.png` era **otro cuerpo/otra pose** que `frontal.png`;
   deformarlo para que calzara abría slivers y rompía proporciones.
2. **El trace-por-bucket fragmentaba:** los músculos del dibujo venían **sombreados** (un mismo
   músculo con varios tonos del mismo hue). Agrupar por "color exacto" partía cada músculo en
   trozos inconexos. El pipeline que funcionó en posterior (blobs separados por línea negra) **no**
   sirve cuando el músculo tiene gradiente.

---

## Intento 5: `musculosblanco.png` como lámina base (F8)

**Hipótesis:** si `musculos.png` y `frontal.png` son cuerpos distintos, **cambiar la lámina** de
heroico-frontal a `musculosblanco.png` (la misma figura del dibujo, sin color) → el trazo del
dibujo calza pixel-perfect porque base y mapa son la **misma** figura.
**Resultado:** **Rechazado por el usuario.** `frontal.png` es la lámina **innegociable** (es la que
quiere ver). No se cambia la figura base para acomodar el mapa; el mapa se acomoda a la figura.

---

## Intento 6 — LA SOLUCIÓN: clasificación POR PÍXEL (HUE + posición) sobre el dibujo alineado (F9)

Dos cambios destrabaron todo:

1. **El usuario re-exportó `musculos.png` ALINEADO con `frontal.png`** (misma pose/encuadre) →
   siluetas casi idénticas → el trazo **calza sin warp**. Se elimina la causa del Intento 4.1.
2. **Se clasifica por HUE + POSICIÓN, no por bucket de color** (`paint-frontal.js`). Cada píxel →
   `keyOf(r,g,b, cy, cx, isArm)`:
   - **familia de hue** (rosa/azul/morado/verde/crema/piel), no color exacto → el sombreado **no
     fragmenta** (cura el Intento 4.2);
   - **posición (cy,cx)** desambigua un hue repetido (crema arriba=cabeza / bajo clavícula=pecho);
   - **`isArm`** (¿el píxel está en un *run* de brazo que no cruza la línea media, existiendo torso?)
     separa el morado-de-brazo del morado-de-muslo aunque la x se solape en la cadera.

Y el post-proceso que cierra los huecos de las líneas negras:

```
clasifica cada píxel → DILATA etiquetas sobre las líneas (4 pasadas, se tocan en el
centro de la línea) → componentes conexos por etiqueta → contorno Moore + RDP →
normaliza 0..1 → configs/heroic-frontal-final.json → apply-frontal.js → HEROIC_FRONTAL
```

Más **overrides de silueta** para lo que el color rompe: `head-shape.js` (mide el borde de la
cabeza en `frontal.png` y lo espeja → simétrico) y `knee-shape.js` (hexágono de la rótula).

**Resultado:** **Convergió.** 15 regiones frontales correctas (brazo dividido en
shoulder·bicep·forearm·hand), interactivas, simétricas en lo medido. Se ELIMINARON por deuda técnica
`build-frontal.js` (F1–F7), el warp y el trace-por-blob. tests + tsc verdes.

---

## Lo que quedó (la frontera siguiente: los BORDES)

`paint-frontal` da la **división correcta**, pero los **bordes** aún fallan de forma **sistémica**
(medido, no a ojo) — abordado en `plan-canon-afinar-bordes-frontal.md`:

| Causa | Efecto |
|---|---|
| **Base distinta:** regiones normalizadas a `musculos.png` ≠ `frontal.png` (~2-3%) | músculos se **salen** en piernas/pies/manos |
| **Contornos independientes + dilatación:** cada músculo se contornea aparte | **solapes** y **huecos** en la línea |
| **Dos bases:** overrides en base `frontal`, vecinos en base `musculos` | **mismatch** en la frontera (rodilla/cuello) |

La cura propuesta (`refine-frontal.js`) NO re-divide: siembra **un** label-map de los paths
actuales, lo **clipa a la silueta de `frontal.png`** (nada se sale), **comparte** las fronteras
internas (una sola línea → imposible solape/hueco) y re-contornea. Es pulido final.

---

## Lecciones transversales (las que costaron sesiones)

1. **Nunca cajas (P9).** Decidido en el Intento 0; no se renegocia.
2. **No generar a ojo — trazar del material real.** Intentos 2–3 (generador) perdieron contra
   trazar el dibujo del usuario (Intento 6). Un generador no ve el músculo.
3. **No warpear otra pose.** Acomodar el mapa a la figura, no la figura al mapa (Intentos 4.1 y 5).
   La clave fue que el usuario **re-exportara alineado**.
4. **El sombreado mata el bucket de color.** Clasificar por **familia de hue + posición**, no por
   color exacto (Intento 4.2 → 6).
5. **Separar por anatomía, no por x.** `isArm` (runs que no cruzan la línea media) distingue brazo
   de torso aunque la x se solape.
6. **Verificar con render PURO**, no a ojo sobre la lámina (la lámina tapa los huecos): cualquier
   blanco interior = hueco.
7. **Simetría por construcción:** medir un lado y espejar mata las asimetrías de raíz.
8. **Contornos independientes ≈ huecos/solapes garantizados.** Los bordes deben compartirse una
   sola vez (la frontera que aún queda por cerrar).
