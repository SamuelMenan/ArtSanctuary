---
title: "Plan i18n F4: migrar screens y UI compartida a i18n"
audience: dev, ai-agent
status: done
updated: 2026-08-14
owner: TBD
---

> ✅ **Implementado en su mayoría — corregido de `draft` a `done` el
> 2026-08-14.** Verificado con `grep`: `HomeScreen.tsx` usa `t('home.*')`,
> `Navbar`/`Sidebar` usan `t('nav.*')`/`t('sidebar.*')`. **Excepción:**
> Color Mixing no usa el sistema `t()` estándar — tiene su propio helper
> bilingüe (`getMixLabels(locale === 'es')` en `colorMixHelpers.ts`), un
> mecanismo paralelo no contemplado por este plan. No verificado si eso
> importa para el objetivo del guardarraíl (ver
> [`plan-i18n-f5-guardarrail.md`](plan-i18n-f5-guardarrail.md)) o si es una
> implementación alternativa igualmente válida.

# Plan i18n F4 — Screens varios + shared/ui

> Fase 4 del [`plan-i18n-maestro.md`](./plan-i18n-maestro.md). **Autocontenido.**

## Contexto (qué venimos haciendo)

Proyecto **ArtSanctuary** (Next 16 App Router). Eliminando copy español hardcodeado:
todo el texto visible sale de `t('namespace.key')`. Hechos: **F1 validaciones**,
**F2 crop+grid** (commits `233cfff`, `e5aad68`, `a369a83`, `0fe6fed`). **F3 boards**
en su propio plan. Esta fase: **screens de display + UI compartida**.

### Sistema i18n (resumen operativo)
- Editar **AMBOS** diccionarios: `src/shared/i18n/messages/es.ts` y `en.ts` (mismas claves).
  Namespaces: `common, nav, menu, home, gallery, explore, profile, settings, sidebar,
  upload, auth, modal, validation, crop, grid` (+ `boards` tras F3).
- **Cliente**: `const { t } = usePreferences()` desde
  `@frontend/shared/providers/AppPreferencesProvider`.
- **Servidor (RSC, sin 'use client')**: `createTranslator(getDictionary(locale))`,
  con `getDictionary` desde `@shared/i18n/dictionaries`, y `locale` desde
  `getRequestLocale()` (`@backend/requestPreferences`) o cookie.
- Interpolación `{{var}}` + `t('k', { var })`.

### Reglas
- **Comentarios NO se traducen.** Identificadores/logs → inglés (oportunista).
- No tocar claves de BD/API. El valor **ES idéntico**; añadir el **EN** correcto.
- Iconos `material-symbols-outlined` no son copy.

### Verificación (por archivo/commit)
- `npx tsc --noEmit`, `npx vitest run` (28 tests), `npm run i18n:scan`.
- El **scan subcuenta** (no detecta MAYÚSCULAS/sin-tildes) → revisar botones a mano.
- Commit: `i18n(F4): <pieza>`.

## Objetivo

Migrar el copy de los screens públicos y la UI compartida. Ampliar los namespaces
existentes (`home`, `modal`, `common`, `upload`, `profile`…) en vez de crear muchos
nuevos.

## Inventario (scan + manual)

| Archivo | Tipo | Copy (aprox) | Namespace sugerido |
|---|---|---:|---|
| `features/home/screens/HomeScreen.tsx` | **server** | 8 (marketing; hay ternarios es/en inline) | `home.*` |
| `features/artwork/components/ArtworkForm.tsx` | client | 5 (labels/placeholders del formulario de subida) | `upload.*` |
| `shared/ui/SaveToCollectionModal.tsx` | client | 3 ("No tienes colecciones aún.", "Nueva colección…", …) | `modal.*` o `common.*` |
| `shared/ui/artwork-modal/ArtworkMeta.tsx` | client | 2 | `modal.*` |
| `features/tools/canon/screens/CanonScreen.tsx` | client | 2 | nuevo `canon.*` |
| `shared/ui/UploadButton.tsx` | client | 1 ("Subir obra") | `upload.*` |
| `shared/ui/CollectionActions.tsx` | client | 1 | `common.*` |
| `features/tools/shared/ImageSourceModal.tsx` | client | 1 | `modal.*` |
| `features/collections/screens/CollectionDetailScreen.tsx` | **server** | 1 ("Esta colección está vacía") | `common.*` |
| `features/auth/screens/RegisterScreen.tsx` | client | 1 | `auth.*` |

> Total scan ≈ 25; con labels mayúsculas algunos más.

### Caso especial HomeScreen (marketing)
Tiene **ternarios `locale === 'en' ? '…' : '…'` inline**. Sustituir cada ternario por
una clave `home.*` (el ternario desaparece; el valor sale del diccionario). Es un
Server Component → ya tiene `locale` y `t = createTranslator(getDictionary(locale))`.

## Procedimiento

1. **HomeScreen** (mayor): pasar marketing inline → `home.*`. 1 commit.
2. **artwork** (`ArtworkForm`, `UploadButton`): formulario de subida → `upload.*`.
3. **shared/ui modales** (`SaveToCollectionModal`, `ArtworkMeta`, `ImageSourceModal`,
   `CollectionActions`): → `modal.*`/`common.*`.
4. **resto** (`CanonScreen`, `CollectionDetailScreen`, `RegisterScreen`).
5. Tras cada grupo: tsc + tests + scan; commit.

### Patrón (server component)
```tsx
// HomeScreen (server)
const t = createTranslator(getDictionary(locale))
// ANTES: {locale === 'en' ? 'Your creative sanctuary' : 'Tu santuario creativo'}
// DESPUÉS: {t('home.hero')}
```
```ts
// es.ts / en.ts → home: { hero: 'Tu santuario creativo' } / { hero: 'Your creative sanctuary' }
```

## Métrica de éxito
- `npm run i18n:scan` sin hits en estos archivos.
- ES↔EN traduce Home/Explore/perfil/modales.
- tsc + 28 tests verdes; ES idéntico.
