# Auditoría de estructura — ArtSanctuary

> Fecha: 2026-06-02 · Objetivo: árbol completo del repo, detectar obsoletos, recolocar archivos exiliados, eliminar código muerto y proponer reestructuración. Norte: **código simple, rápido y organizado.**

---

## 1. Resumen ejecutivo

| Severidad | Hallazgo | Acción |
|-----------|----------|--------|
| 🔴 CRÍTICO | `mcp/node_modules/` está **git-trackeado**: 3 863 de 4 191 archivos del repo (**92 %**) son dependencias commiteadas, con binarios `.exe`/`.bin`. | `git rm -r --cached mcp/node_modules` |
| 🔴 CRÍTICO | Artefactos de build de `mcp/` trackeados pese a estar en `.gitignore` (`index.js`, `.map`, `.d.ts`). | `git rm --cached mcp/index.{js,js.map,d.ts,d.ts.map}` |
| 🟠 OBSOLETO | `scripts/reset_social.js` — script suelto, no referenciado en `package.json`, toca la BD directamente. | Revisar y borrar o mover a `scripts/oneoff/`. |
| 🟠 OBSOLETO | `public/uploads/` y `storage/uploads/` — imágenes locales legacy. Ya migrado todo a Vercel Blob; no trackeadas (solo disco). | Borrar del disco local cuando se confirme prod OK. |
| 🟡 ESTRUCTURA | `features/profile/` — 7 componentes sueltos en la raíz del feature (sin `components/`). | Mover a `profile/components/`. |
| 🟡 ESTRUCTURA | `features/settings/` — 11 archivos sueltos en la raíz del feature, mezclados con subcarpetas. | Reagrupar en `components/`, `hooks/`, `lib/`. |
| 🟢 SANO | Raíz del repo limpia (solo configs estándar). `src/` con arquitectura por capas coherente. | — |

**El 92 % del peso del repo es eliminable sin tocar una línea de código de la app.**

---

## 2. Árbol de carpetas (alto nivel)

```
ArtSanctuary/
├── src/
│   ├── app/                     # Next.js App Router (rutas + páginas)
│   │   ├── api/                 # 30 route handlers REST
│   │   ├── dashboard/tools/     # boards, canon, color-mixing, crop, gesture, grid, notan
│   │   ├── uploads/[...path]/   # ⚠ ruta legacy de servido local (ver §5)
│   │   └── (gallery, explore, profile, settings, login, register, upload, collections)
│   ├── backend/                 # Capa servidor
│   │   ├── auth/  db/  http/  models/  services/  upload/
│   ├── frontend/
│   │   ├── features/            # Feature-first: artwork, auth, collections, explore,
│   │   │                        #   gallery, home, profile, settings, tools
│   │   └── shared/              # layouts, providers, ui
│   └── shared/                  # Isomórfico: i18n, lib (image, boards, validation, tools)
├── docs/                        # adr, api, architecture, ops, features, performance...
├── mcp/                         # Servidor MCP propio (herramienta de dev)
│   └── node_modules/            # 🔴 3 863 archivos trackeados por error
├── scripts/                     # seed.ts, find-hardcoded-strings.mjs, reset_social.js
├── types/                       # next-auth.d.ts
├── public/                      # estáticos + uploads/ (legacy local)
└── storage/uploads/             # fallback de subida en dev (no trackeado)
```

### Convención de feature (la buena, ya usada por `tools/*`, `artwork`, `color-mixing`)
```
features/<nombre>/
├── components/    # UI tonta
├── hooks/         # estado/lógica React
├── lib/           # lógica pura + *.test.ts
└── screens/       # composición de pantalla (entrada del feature)
```

---

## 3. 🔴 Crítico — higiene de Git

### 3.1 `mcp/node_modules` commiteado
`.gitignore` ya tiene `**/node_modules`, pero **git no des-trackea lo ya commiteado**. Se subió antes de la regla.

```bash
git rm -r --cached mcp/node_modules
```

### 3.2 Artefactos de build de mcp
Ignorados en `.gitignore:56-59` pero aún trackeados:

```bash
git rm --cached mcp/index.js mcp/index.js.map mcp/index.d.ts mcp/index.d.ts.map
```

> `mcp/index.ts` y `mcp/lib/*.ts` (fuente) **sí** se quedan. Solo se quitan los compilados.

Commit:
```bash
git commit -m "chore(repo): deja de trackear mcp/node_modules y artefactos de build"
```

Resultado: repo de ~4 191 → ~328 archivos. Clones e índice mucho más rápidos.

---

## 4. 🟠 Archivos obsoletos

| Archivo | Estado | Recomendación |
|---------|--------|---------------|
| `scripts/reset_social.js` | No referenciado en `package.json`. Único `.js` entre scripts `.ts`/`.mjs`. Resetea datos sociales en BD. | Confirmar si se usa; si no, **borrar**. Si es one-off útil, mover a `scripts/oneoff/` y documentar. |
| `public/uploads/*` | Imágenes locales legacy. Migradas a Blob. No trackeadas. | Borrar del disco tras verificar prod. |
| `storage/uploads/*` | Fallback de subida en dev. No trackeado. | Conservar para dev local, o limpiar periódicamente. |
| `mcp/login_body.html`, `mcp/login_desktop_raw.html` | Artefactos scrapeados de debug. Ya en `.gitignore:60`. | Verificar que no estén trackeados; borrar del disco. |

---

## 5. 🟡 Código potencialmente reducible (no urgente)

**Servido de imágenes local** — ahora que producción usa Vercel Blob y la BD no tiene ninguna ref `/uploads/` viva:

- `src/app/uploads/[...path]/route.ts` — sirve archivos desde `storage/`.
- `src/backend/upload/storage.ts` — rama local de `saveImage`/`deleteImage`.

Siguen siendo el **fallback de desarrollo local** (sin token Blob). No es código muerto, pero es la pieza que causó el bug de imágenes invisibles. Opciones:
1. **Conservar** como fallback dev (estado actual, documentado).
2. **Simplificar**: usar Blob también en dev (token en `.env.local`, ya disponible) y borrar la rama local + la ruta `/uploads`. Menos superficie, un solo camino de código → más simple y predecible.

> Recomendado a futuro: opción 2. Un único backend de imágenes elimina toda una clase de bugs «existe local, no en prod».

---

## 6. 🟡 Archivos exiliados / estructura inconsistente

Dos features rompen la convención (componentes sueltos en la raíz del feature en vez de `components/`).

### `features/profile/`  →  mover a `profile/components/`
```
ArtworkSectionHeader.tsx  EmptyPortfolio.tsx  FollowListModal.tsx
FollowStats.tsx  ProfileHero.tsx  ProfileMetaBlock.tsx  SocialLinks.tsx
```

### `features/settings/`  →  reagrupar
```
components/   AccountForm  AppearanceForm  AvatarUploader  DangerZone
              NotificationsForm  PrivacyForm  ProfileForm  StatusBanner  Toggle
hooks/        useStatus.ts
lib/          formStyles.ts
```
(ya existen `settings/account/`, `settings/profile/`, `settings/screens/` — encajan igual)

> Mover con cuidado: actualizar imports. Al usar alias `@frontend/...`, el cambio es mecánico y `tsc`/eslint lo detectan.

---

## 7. Plan de acción priorizado

1. **[10 min, 0 riesgo]** Des-trackear `mcp/node_modules` + artefactos build (§3). Mayor impacto, nulo riesgo.
2. **[5 min]** Resolver `scripts/reset_social.js` y HTML scrapeados (§4).
3. **[15 min]** Recolocar `features/profile` y `features/settings` (§6) + `npm run lint && npm test`.
4. **[opcional]** Borrar `public/uploads` y `storage/uploads` locales tras confirmar prod.
5. **[futuro]** Unificar backend de imágenes en Blob (§5 opción 2).

Cada paso es independiente y commiteable por separado.
