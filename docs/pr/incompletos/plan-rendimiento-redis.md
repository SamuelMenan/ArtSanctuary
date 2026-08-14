# Plan de rendimiento con Redis (mejoras futuras #1–#3)

> Fecha: 2026-06-02 · Base: [resultados-verificacion.md](./resultados-verificacion.md) Fase 3.
> Estado: **pendiente, a futuro.** No es necesario ahora. El #4 (precarga del modelo IA) ya está hecho.
> Objetivo: reducir latencia real percibida por el usuario en galería/perfiles e imágenes, con caché Redis como backend de datos cacheados.

---

## Por qué Redis (y no solo `unstable_cache`)

`unstable_cache`/Cache Components de Next cachean en el sistema de archivos/red del runtime. En Vercel serverless eso es por-instancia y efímero. **Redis** da una caché compartida entre todas las funciones y regiones, persistente entre despliegues, con invalidación por clave/tag explícita.

**Proveedor recomendado:** Upstash Redis (Marketplace de Vercel) — serverless, HTTP, sin conexiones persistentes (encaja con lambdas). Variable autoinyectada: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. SDK: `@upstash/redis`.

> Alternativa: Vercel Runtime Cache API (clave-valor por región con tags) si no se quiere dependencia externa. Redis gana si se necesita caché global consistente.

---

## Arquitectura de caché (transversal a #1–#3)

Crear un módulo único `src/backend/cache/redis.ts`:

```ts
import "server-only";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

/** Lee de caché; si falla, ejecuta `fetcher`, guarda y devuelve. Degradación
 *  elegante: si Redis cae, NO rompe la página, va directo a Mongo. */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch { /* Redis caído → seguir a Mongo */ }
  const fresh = await fetcher();
  try { await redis.set(key, fresh, { ex: ttlSeconds }); } catch {}
  return fresh;
}

/** Invalida por prefijo (p. ej. tras crear/editar/borrar una obra). */
export async function invalidate(prefix: string): Promise<void> {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys);
  } catch {}
}
```

**Regla de oro:** la caché nunca debe ser un punto de fallo. Todo en `try/catch` con fallback a la fuente real.

---

## #1 — Cachear galería y feeds (mayor impacto)

**Problema:** `getGalleryArtworks`, `getFollowingFeed`, `getPublicProfile`, `getArtworksByArtist` consultan Mongo en cada visita.

**Solución:**
- Envolver las lecturas públicas (no personalizadas) en `cached(...)`:
  - `gallery:<category>` → `getGalleryArtworks` · TTL 60–120 s.
  - `profile:<id>:public` → obras públicas del perfil · TTL 120 s.
- **No cachear** lo personalizado por usuario (feed de seguidos) salvo con clave por-usuario y TTL corto (30 s) — o dejarlo sin caché.
- **Invalidación:** en `createArtwork`/`updateArtwork`/`deleteArtwork`/`interactWithArtwork` → `invalidate("gallery:")` y `invalidate("profile:<artistId>")`.

**Punto clave:** ya existe `getPublicGallery` con `unstable_cache` + tag `ARTWORKS_TAG`, pero **el screen de galería no la usa** (usa `getGalleryArtworks` sin caché). Unificar: una sola función pública cacheada que sirva a screen y a la ruta API.

**Esperado:** galería y perfiles públicos servidos desde Redis en ~ms, sin golpear Mongo en cada carga.

---

## #2 — `next/image` para imágenes de Blob

**Problema:** 3 `<img>` crudos (`ArtworkGrid`, `ArtworkMedia`) sirven el original del Blob sin optimizar.

**Solución:**
1. Añadir el host del Blob a `next.config.ts → images.remotePatterns`:
   ```ts
   { protocol: "https", hostname: "*.public.blob.vercel-storage.com" }
   ```
2. Sustituir `<img>` por `next/image` en `ArtworkGrid` y `ArtworkMedia`, con `sizes` correctos para masonry y `fill`/dimensiones según layout.
3. Verificar que el COEP (`credentialless`) sigue permitiendo el optimizador (mismo origen `/_next/image`, sin problema CORP).

**Esperado:** AVIF/WebP automático, resize por viewport, `lazy` nativo → menos bytes, render visual más rápido. **No necesita Redis** (es ortogonal), pero entra en el mismo lote de rendimiento.

> Nota: `next/image` en Vercel tiene su propia caché de imágenes optimizadas (CDN), independiente de Redis.

---

## #3 — Paginar la galería

**Problema:** `getGalleryArtworks` trae **todas** las obras públicas en una query, sin límite. Crece linealmente con el catálogo.

**Solución:**
- Reusar la firma paginada que ya existe (`getPublicGallery({ page, limit, category })`).
- Galería: `limit` 24–48 por página. UI con scroll infinito (IntersectionObserver) o paginación clásica `?page=`.
- Combinar con #1: clave de caché `gallery:<category>:<page>`.

**Esperado:** primera carga trae 1 página, no el catálogo entero → menos datos, menos transferencia, TTFB estable al crecer.

---

## Orden de ejecución (futuro)

1. **Infra:** provisionar Upstash en Vercel + `src/backend/cache/redis.ts` + helper `cached/invalidate`.
2. **#3 paginar** (cambia la forma de los datos; hacerlo antes de cachear).
3. **#1 cachear** las funciones públicas + invalidación en mutaciones.
4. **#2 `next/image`** (independiente; puede ir en paralelo).

Cada uno es un PR separado, con su verificación (tsc · tests · build · medición antes/después en el bundle/Network).

## Riesgos / cuidado
- **Invalidación correcta**: si se cachea sin invalidar en las mutaciones, el usuario sube una obra y no la ve → mismo tipo de bug que el de las imágenes invisibles. Invalidar SIEMPRE en create/update/delete/interact.
- **Datos personalizados**: no cachear globalmente nada que dependa del usuario (sesión, follows, privacidad) sin clave por-usuario.
- **Degradación elegante**: Redis caído nunca debe tumbar la página.
