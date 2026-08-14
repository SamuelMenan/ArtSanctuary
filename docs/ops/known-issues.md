---
title: Bugs conocidos (sin resolver)
audience: dev, ops
status: stable
updated: 2026-08-14
owner: TBD
---

# Bugs conocidos

Defectos **reales de código** encontrados durante la auditoría de documentación
de 2026-08-13/14. Están aquí documentados a propósito y **sin arreglar**: la
prioridad acordada era dejar primero la arquitectura documental sólida, y
resolver el código después. Este registro existe para que no se pierdan.

Casi todos se encontraron *de casualidad*, verificando otra cosa. Asumir que
hay más.

**Cómo cerrar uno:** arreglarlo, y borrar su entrada de este archivo en el
mismo commit. No dejar entradas "resueltas" — para eso está el historial de git.

---

## 1. 🔴 La galería de todo perfil público está vacía

**Dónde:** `src/backend/services/users.service.ts` → `getPublicProfile()`

```ts
const artworks = await Artwork.find({ author: user._id, isPublic: true })
```

**El modelo `Artwork` no tiene `author` ni `isPublic`** — tiene `artistId` y
`visibility: 'public'|'unlisted'|'private'` (ver
[`../architecture/data-model.md#artwork`](../architecture/data-model.md#artwork)).
Mongoose no valida campos desconocidos en un filtro de lectura, así que la
query **no lanza: devuelve `[]` siempre, en silencio**.

**Impacto:** `GET /api/users/[username]` responde 200 con el perfil correcto y
la galería del artista vacía. Sin error en logs. Afecta a todos los perfiles
públicos.

El mismo repo lo hace bien en `explore.service.ts` (`{ visibility: "public" }`)
y el índice del modelo es `{ artistId: 1, visibility: 1 }`.

**Extra:** el `.select()` de esa misma query pide tres campos que tampoco
existen (`thumbnailUrl` — es `thumbnails{}`; `year`; y ordena por `createdAt`
mientras el resto del código usa `uploadDate`).

---

## 2. 🔴 Una conexión fallida a Mongo deja el proceso muerto

**Dónde:** `src/backend/db/mongoose.ts` → `connectDB()`

```ts
if (!cached.promise) {
  cached.promise = mongoose.connect(MONGODB_URI as string, { bufferCommands: false });
}
cached.conn = await cached.promise;
```

**Falta el `catch` que resetee `cached.promise = null` si la conexión falla** —
es la omisión clásica respecto al patrón canónico de Next.js. Si la primera
conexión falla (Atlas caído, DNS, IP fuera del allowlist), la promesa rechazada
queda cacheada en `global._mongoose` y **todas** las peticiones siguientes de
ese proceso hacen `await` sobre la misma promesa rechazada → 500 perpetuos
hasta reiniciar la lambda, aunque la DB ya se haya recuperado.

---

## 3. 🟠 Fuga de almacenamiento al borrar una cuenta

**Dónde:** `src/backend/services/users.service.ts` → `deleteAccountCascade()`

La cascada borra los **documentos** `Artwork` (paso 1) pero **nunca sus blobs**.
Las imágenes quedan huérfanas en Vercel Blob / `public/uploads` para siempre.
Solo se borra el avatar, y únicamente si el caller pasa la URL.

Lo mismo aplica a cualquier imagen de portada de `Collection`.

**Extra:** el `User.deleteOne` es el **penúltimo** paso, así que si el paso 4
(`$pull` sobre followers, potencialmente costoso) falla, el usuario queda
parcialmente destruido pero **aún logueable**.

---

## 4. 🟠 `getUserById` devuelve `passwordHash`

**Dónde:** `src/backend/services/users.service.ts:53`

`User.findById(id).lean()` **sin `.select()`** → devuelve el documento completo,
incluido `passwordHash` y `email`. Depende de que cada caller recorte. Merece
auditar los consumidores antes de que uno lo serialice a un RSC o al cliente.

Relacionado, menor: `isUsernameTaken`/`isEmailTaken` también traen el documento
entero (con `passwordHash`) solo para calcular un booleano.

---

## 5. 🟠 La capa de grid híbrido de Carnaval está desactivada de facto

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

## 6. 🟠 `explore.service.ts` son dos stubs disfrazados de feature

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

## 7. 🟡 `mirrorSelectedImagesForLateral` no existe pero el test la importa

**Dónde:** `src/shared/lib/workspaces/carnaval/lateralMirror.ts` +
`lateralMirror.test.ts`

Los 2 tests rotos que documenta
[`../contributing/testing.md`](../contributing/testing.md). Diagnóstico preciso:

- **La matemática del espejo es correcta** — verificada a mano contra las
  expectativas del test (posición, rotación, `points`, `align`, `flipX`).
- El test 3 falla porque `mirrorSelectedImagesForLateral` **nunca se
  implementó** (no existe en ningún archivo del repo).
- El test 2 falla por las expectativas de `id`/`mirroredFrom`, no por el
  algoritmo: espera conservar el `id` original, pero `mirrorBoardObject` genera
  uno nuevo y marca `mirroredFrom`.

> ⚠️ **No "arreglar" el test quitando `mirroredFrom`.** Ese campo es la marca
> que `syncCarnavalLateralMirror` (`boards.service.ts`) usa para distinguir los
> espejos viejos de los objetos propios del plano izquierdo al reconciliar.
> Quitarlo rompe el servicio en silencio.

Nota: `boards.service.ts` ya filtra a mano por el flag `o.lateralMirror`, pero
**no** por `type === 'image'`, mientras el test sí espera ese filtro. Hay que
decidir cuál es la semántica correcta antes de implementar la función.

---

## 8. 🟡 Imports "sin usar" que sostienen producción

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

## 9. 🟡 `followUser` permite seguirse a uno mismo

**Dónde:** `src/backend/services/users.service.ts:75`

No hay comprobación de `followerId !== followingId` → `followUser(x, x)` es
válido y crea una notificación de que te sigues a ti mismo. Tampoco respeta
`privacySettings.allowFollow` (ese flag solo se lee en `getFollowConnections`).

Además el retorno usa `followers?.length || 1` — un fallback que **miente** si
el array viene vacío. Y sin transacción: si el segundo `$addToSet` falla, queda
el follower registrado sin el following.

---

## 10. 🟡 `uploads/[...path]/route.ts` es código muerto con defensa frágil

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

## 11. 🟢 `buildTransformedCanvas` duplicado

**Dónde:** `src/frontend/features/tools/crop/CropTool.tsx:25`

Define su propia copia local en vez de importar la compartida de
`@shared/lib/image/canvas` — que además ya importa en la línea 7.

---

## 12. 🟢 Otros desajustes de contrato menores

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

## Cómo se encontraron

Ninguno salió de una búsqueda dirigida de bugs: todos aparecieron leyendo
código para verificar afirmaciones de la documentación. Los checks de
`npm run docs:verify` cubren ahora la clase de desajuste **documentación ↔
contrato**, pero **no** detectan lógica incorrecta como la del punto 1 — para
eso no hay sustituto de leer el código o de tener tests.

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Puntos 1, 2 y 5 verificados leyendo el código directamente. El resto proviene
  de exploración sistemática de `src/backend/services/`, `src/shared/lib/` y
  `src/frontend/features/workspaces/`; no todos se re-verificaron uno por uno.
