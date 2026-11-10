---
title: Bugs conocidos (sin resolver)
audience: dev, ops
status: stable
updated: 2026-08-15
owner: TBD
---

# Bugs conocidos

Defectos **reales de código** que siguen sin resolver. Se encontraron durante
la auditoría de documentación de 2026-08-13/14, casi todos *de casualidad* al
verificar otra cosa — así que asumir que hay más.

**Cómo cerrar uno:** arreglarlo y borrar su entrada en el mismo commit. No se
dejan entradas "resueltas": para eso está el historial de git.

> **Las entradas 1–5 son decisiones de producto, no descuidos.** Implementar un
> "trending" real o el grid híbrido es construir una feature, no reparar algo
> roto. Los dos de contrato (imports load-bearing, ruta muerta) son trampas
> documentadas a propósito para que nadie las "limpie" sin querer.
>
> **Las entradas 6–8 (añadidas el 2026-08-15) sí son defectos.** Las tres se
> encontraron trabajando en el board de Carnaval y en los modificadores de
> redimensionado, y las tres tienen arreglo conocido y acotado — están aquí
> porque se decidió documentar antes que parchear.

### Resueltos el 2026-08-14

Se arreglaron en la misma sesión y ya no están listados: la galería vacía de
todo perfil público (`getPublicProfile` consultaba campos inexistentes), la
promesa de conexión rechazada que se cacheaba para siempre, la fuga de blobs
al borrar cuenta, el auto-follow, `buildTransformedCanvas` duplicado y los
tests rotos de `lateralMirror`. Detalle en `git log`.

**Uno de los "bugs" registrados resultó falso:** se afirmaba que `getUserById`
filtraba `passwordHash`. Al ir a arreglarlo se comprobó que el schema ya lo
declara `select: false`, así que nunca se devolvía. Lo había anotado un agente
de exploración y se registró sin verificar — recordatorio de que este archivo
también necesita verificación antes de actuar sobre él.

---

## 1. 🟠 La capa de grid híbrido de Carnaval está desactivada de facto

**Dónde:** `src/shared/lib/workspaces/carnaval/rules.ts`

```ts
export function carnavalUsesHybridGrid(rule: CarnavalRule): boolean {
  return false
}
```

Stub que **ignora su parámetro y siempre devuelve `false`**, pese a que su
JSDoc describe lógica real (medidas coprimas a un cuadro legible). Tiene
consumidor vivo en `CarnavalLayers.tsx` → toda esa capa está apagada sin que
nada lo indique.

---

## 2. 🟠 `explore.service.ts` son dos stubs disfrazados de feature

**Dónde:** `src/backend/services/explore.service.ts` → `getExploreTrending()`

- **`trendingTags` es un array literal hardcodeado** de 8 claves i18n. No hay
  ninguna noción de "trending" real. El propio comentario lo admite
  (*"simulado; en producción: aggregation sobre Artwork.tags"*).
- **`featuredArtists` = `User.find({}).limit(4)`** — sin `sort` ni filtro. En la
  práctica son los 4 usuarios más antiguos, para siempre.
- `recentArtworks` sí es real, pero es "novedades", no "tendencia".
- La única agregación real es el conteo por categoría, y va **sin `$sort` ni
  `$limit`**.

Está cacheado con `unstable_cache(..., { revalidate: 60 })`, así que el stub se
sirve igual durante 60s.

---

## 3. 🟡 Imports "sin usar" que sostienen producción

**Dónde:** `src/backend/services/notifications.service.ts`

```ts
import "@backend/models/User";
import "@backend/models/Artwork";
```

Existen **solo por efecto secundario**: registran los schemas en Mongoose para
que el `.populate()` no lance `MissingSchemaError` en un arranque en frío.
Cualquier "limpieza de imports no usados" (linter, IDE, agente) **rompe
producción en frío** sin fallar en local.

---

## 4. 🟡 `uploads/[...path]/route.ts` es código muerto con defensa frágil

**Dónde:** `src/app/uploads/[...path]/route.ts`

Efectivamente muerto: sirve desde `public/uploads` (que Next ya sirve antes de
llegar al handler) y desde `storage/uploads`, **directorio que no existe en el
repo**. Cero referencias en `src/`.

Mientras siga vivo:
- La defensa de path traversal (`normalize` + regex de strip) **no tiene el
  check canónico de contención** (`if (!abs.startsWith(base)) return 404`).
  Funciona hoy, pero descansa en el regex en vez de en la comprobación.
- Sirve `.svg` como `image/svg+xml` **sin `Content-Disposition`** → XSS
  almacenado si algún día entra un SVG en `public/uploads` (el `/api/upload`
  actual no lo permite, pero esta ruta sirve lo que haya en disco).
- `fs.existsSync` **síncrono** bloquea el event loop.

Candidato claro a borrado.

---

## 5. 🟢 Otros desajustes de contrato menores

- **`markNotificationRead` no usa `.lean()`** pese a que su docstring dice
  "POJO o null" y la cabecera del fichero dice "Solo DB (POJOs)". Devuelve un
  documento Mongoose hidratado.
- **`getUserNotifications` está capado a 20 sin paginación** — no hay forma de
  ver la número 21.
- **`getFollowConnections` no pagina** — un usuario con 100k seguidores los
  carga todos. Y devuelve la lista completa junto al flag `allowFollow`,
  delegando la decisión de acceso al controlador: si un caller olvida mirarlo,
  filtra.
- **`isUsernameTaken` no normaliza a minúsculas** mientras `getPublicProfile` sí
  → asimetría real (puede decir "libre" y luego colisionar).
- **`getMedium()` cae a `oil` en silencio** si el id no existe, nunca lanza.
- **`baseAlong(base, 'espesor')` devuelve `base.largo`** silenciosamente — el
  fall-through es alcanzable aunque el comentario diga que no.
- **`mirrorPoints` tiene una rama muerta** para arrays de longitud impar que
  produce puntos duplicados.

---

## 6. 🔴 El Inspector mide de menos en Disfraz Individual

**Dónde:** `src/frontend/features/workspaces/carnaval/lib/carnavalInspect.ts` →
`objectsBBoxPx`

La envolvente medida **excluye** los objetos llamados `'Figura humana'`
(`HUMAN_FIGURE_NAME`), porque son referencia y no obra. Correcto en `comparsa`,
donde el reglamento mide el alto **de los hombros hacia arriba**.

En `disfraz`, en cambio, el alto que guarda `rules.ts` (**27–30 cm** con la
tabla vigente del 2026-08-15) es **TOTAL desde la base** e incluye los 15 cm de
figura humana. Al
excluirla, el Inspector mide solo la parte sobre los hombros y reporta
**"bajo mínimo" en bocetos que sí cumplen**.

Es el fallo más visible de la lista: sale en pantalla, al usuario, con un
número rojo. No se arregló en el momento por decisión explícita ("no tocar la
medición ahora"). **El arreglo debe ser por modalidad**, no global: aplicar a
`comparsa` el criterio de `disfraz` rompería la otra mitad. Anotado también
como `PENDIENTE` en el propio archivo.

---

## 7. 🟠 El imán de redimensionado pelea contra los modificadores de teclado

**Dónde:** `src/frontend/features/tools/boards/components/BoardStage.tsx`

Tres defectos en el mismo bloque, con causa común:

- **El `boundBoxFunc` deshace la caja que Konva acaba de calcular.** Imanta cada
  borde por separado, así que con centrado (`Alt`) se mueven los dos bordes
  opuestos, cada uno cae en una línea distinta y el objeto **deriva**; con
  proporción (`Shift`/`Ctrl`) imantar el ancho sin recalcular el alto rompe la
  razón. El guard `delta > 0.01` del [ADR-0005](../adr/0005-konva-grid-snap-resize.md)
  asume que siempre hay un lado quieto — con centrado no lo hay.
- **El modificador se queda pegado**: el listener oye `keydown`/`keyup` pero no
  `blur`. Soltar `Ctrl` fuera de la ventana (Alt+Tab) deja el board en modo
  proporcional para siempre, sin indicación visual.
- **Tres teclas para dos conductas.** `Shift` (nativo de Konva) y `Ctrl`/`⌘`
  (listener de la app) hacen ambas proporción; `Alt` (nativo) hace centrado.
  Nada de esto está documentado en el panel de atajos.

Los módulos que lo arreglan
(`src/frontend/features/tools/boards/lib/resizeSnap.ts` +
`src/frontend/features/tools/boards/hooks/useResizeModifiers.ts`)
**ya están escritos y testeados, pero sin cablear**: el comportamiento en
producción es todavía el defectuoso. Fases pendientes en
[`../../.plans/pr/incompletos/plan-boards-resize-modificadores.md`](../../.plans/pr/incompletos/plan-boards-resize-modificadores.md).

**Además, `src/frontend/features/tools/boards/lib/resizeBehavior.ts` es código
muerto** (`shouldKeepRatioForResize`, 0 consumidores) que *parece* la
implementación real, y `ctrlPressedRef`
(`BoardStage.tsx:93`) se escribe dos veces y no se lee nunca.

---

## 8. 🟡 El panel de atajos promete una función que no existe

**Dónde:** `src/frontend/features/tools/boards/components/ShortcutsHelp.tsx:18`

Documenta **`Alt + arrastrar → Duplicar arrastrando`**. Esa función no está
implementada en ningún sitio: duplicar solo existe en `Ctrl/⌘+D` y en los
botones. Peor: `Alt` **sí hace algo** distinto de lo anunciado — es el centrado
nativo del `Transformer` (entrada 7).

En el otro sentido, el panel **no tiene ninguna fila** para redimensionar
proporcional ni desde el centro: las dos conductas que sí funcionan son
invisibles para el usuario.

---

## Cómo se encontraron

Ninguno salió de una búsqueda dirigida de bugs: los de 2026-08-13/14
aparecieron leyendo código para verificar afirmaciones de la documentación, y
los tres de 2026-08-15 (6, 7 y 8) al implementar otra cosa encima —
cambiar la figura humana de Carnaval destapó el 6, y planificar los
modificadores de resize destapó el 7 y el 8. `npm run docs:verify`
cubre la clase **documentación ↔ contrato**, pero **no** detecta lógica
incorrecta — la galería vacía de perfil público pasaba todos los checks
automáticos porque los nombres de campo eran sintácticamente válidos, solo que
de otro modelo. Para eso no hay sustituto de leer el código o de tener tests.

## Última verificación

- Fecha: 2026-08-15
- Commit: HEAD (árbol de trabajo, cambios sin commitear)
- Entradas 6–8 verificadas leyendo el código:
  `carnavalInspect.objectsBBoxPx`, el bloque `93-115` + `boundBoxFunc` de
  `BoardStage.tsx`, `ShortcutsHelp.tsx:18` y su clave i18n
  (`boards.scAltDrag` = "Duplicar arrastrando" en `es.ts`/`en.ts`). El mapeo
  nativo de teclas se leyó en `node_modules/konva/lib/shapes/Transformer.js`.
- `npx vitest run`: 20 archivos, 161 tests, exit 0.

### Verificación previa (2026-08-14)

- Cada entrada 1–5 se verificó leyendo el código. `npm test` (i18n:scan +
  19 archivos, 141 tests) y `npx tsc --noEmit` pasaban limpios tras la ronda de
  arreglos.
