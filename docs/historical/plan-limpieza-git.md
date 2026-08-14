# Plan de limpieza del árbol de Git

> Fecha: 2026-06-02 · Base: [auditoria-estructura.md](./auditoria-estructura.md)
> Objetivo: el repo solo debe contener lo necesario para construir y desplegar la app. Todo lo demás (tooling de dev, documentación, scripts one-off) queda **solo en local**.

---

## 1. Qué se saca del repo (y por qué)

| Grupo | Archivos trackeados | Decisión | Motivo |
|-------|--------------------:|----------|--------|
| `mcp/` | **3 876** | Sacar del repo, conservar local | Herramienta de desarrollo propia. No forma parte del build ni del deploy. Incluye `node_modules` y binarios commiteados por error. |
| `docs/` | **64** | Sacar del repo, conservar local | Documentación interna. No necesaria para construir/desplegar. Se versiona en local. |
| `scripts/reset_social.js` | 1 | Sacar del repo, conservar local | Script one-off de BD, no referenciado en `package.json`. |
| `public/*.svg` (file, globe, next, vercel, window) | 5 | Borrar | Boilerplate de Next.js. **0 referencias** en `src/`. |

**Total a des-trackear: ~3 946 de 4 191 → el repo queda en ~245 archivos.**

### Qué se queda (lo esencial)
```
src/            234   código de la app
scripts/        2     seed.ts (npm run seed) + find-hardcoded-strings.mjs (i18n:scan)
types/          1     next-auth.d.ts
public/         0     (tras quitar svgs; añadir aquí solo estáticos reales)
configs raíz    8     package.json, tsconfig, next.config.ts, eslint, postcss, .gitignore, README, lockfile
```

> ⚠ **Trade-off de sacar `docs/`:** se pierde el historial remoto de la documentación; los cambios solo viven en tu disco. Aceptado según decisión. Si en el futuro quieres versionarla sin ensuciar el repo de código, alternativa = repo/rama `docs` aparte. (Este plan y la auditoría también pasan a ser local-only, lo cual es correcto.)

---

## 2. Ejecución

### Paso 1 — Des-trackear (sin borrar del disco)
`--cached` quita del índice de Git pero **mantiene los archivos en local**.

```bash
git rm -r --cached mcp docs
git rm --cached scripts/reset_social.js
```

### Paso 2 — Borrar svgs boilerplate (sin uso)
```bash
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

### Paso 3 — Actualizar `.gitignore`
Añadir al final:
```gitignore
# tooling y docs: solo local, fuera del repo
/mcp
/docs
/scripts/reset_social.js
```
> Las reglas previas de `mcp/` (`/mcp/dist`, `/mcp/index.js`, etc.) quedan redundantes pero inofensivas; opcional limpiarlas y dejar solo `/mcp`.

### Paso 4 — Commit
```bash
git commit -m "chore(repo): saca mcp, docs y scripts one-off del repo (solo local)"
```

### Paso 5 — Verificar
```bash
git ls-files | wc -l          # esperado: ~245
git ls-files | sed 's#/.*##' | sort | uniq -c | sort -rn
git status                    # mcp/ docs/ ya no aparecen (ignorados)
```

---

## 3. Resultado esperado

- Repo de **4 191 → ~245** archivos trackeados (−94 %).
- Clones, `git status`, índice y CI mucho más rápidos.
- Sin binarios ni `node_modules` en historial nuevo.
- `mcp/` y `docs/` intactos en tu disco, ignorados por Git.

> Nota: esto **deja de trackear** a futuro; el peso histórico del repo (`.git/`) no baja hasta un `git gc` agresivo o reescritura de historial (`git filter-repo`). Eso es un paso aparte, opcional, y reescribe hashes — no incluido aquí por seguridad.

---

## 4. Pasos siguientes (de la auditoría, no incluidos aquí)

- Recolocar `features/profile` y `features/settings` a la convención `components/hooks/lib`.
- Unificar backend de imágenes en Vercel Blob (eliminar rama local + ruta `/uploads`).
