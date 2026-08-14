---
title: "Plan i18n F5: barrido final + guardarraíl"
audience: dev, ai-agent
status: completed
updated: 2026-06-01
owner: TBD
---

> ⚠️ **Verificado 2026-08-14 — el estado `completed` ya no refleja la
> realidad en 2 de las 4 métricas de éxito:**
> - `npm run i18n:scan` → **hoy da 3, no 0** (`AuthAside.tsx:27`,
>   `ImageSourceModal.tsx:172`, `CollectionActions.tsx:55` — verificado
>   corriendo el comando). Regresión posterior al cierre de F5, no detectada
>   porque nada la bloquea (ver punto siguiente).
> - **CI que falle si reaparece copy hardcodeado: no existe.** El repo no
>   tiene pipeline CI/CD (`ops/deployment.md`) — la Parte C.2 de este plan
>   nunca se implementó pese a que el plan de cierre lo daba por hecho.
> - Sí implementado y verificado: `react/jsx-no-literals` en `warn` está
>   configurado en `eslint.config.mjs` (Parte C.1).
> - No verificado en esta pasada: paridad de claves es/en (Parte D).
>
> No se corrigieron los 3 hits ni se montó CI — documentado para resolución
> futura, no arreglado en esta pasada.

# Plan i18n F5 — Barrido a 0 + guardarraíl

> Fase 5 (cierre) del [`plan-i18n-maestro.md`](./plan-i18n-maestro.md). **Autocontenido.**
> Ejecutar **después** de F3 (boards) y F4 (screens).

## Contexto (qué venimos haciendo)

Proyecto **ArtSanctuary** (Next 16 App Router). Migración i18n: todo el copy visible
sale de `t('namespace.key')`. Hechos: F1 validaciones, F2 crop+grid; F3 boards y F4
screens en sus planes. Esta fase **cierra**: deja el scan en 0 y mete reglas para que
no reentre copy hardcodeado.

### Sistema i18n (resumen)
- Diccionarios en `src/shared/i18n/messages/{es,en}.ts` (editar ambos).
- Cliente: `usePreferences()` → `t`. Servidor: `createTranslator(getDictionary(locale))`.
- Detector: `npm run i18n:scan` (`scripts/find-hardcoded-strings.mjs`).
- Regla del equipo: **comentarios NO se traducen**; identificadores/logs → inglés.

## Parte A — Barrido a 0

1. `npm run i18n:scan` y migrar **todo** lo que quede (incluye lo que el scan
   subcuenta: revisar botones en MAYÚSCULAS y texto sin tildes a mano).
2. Revisar también lo que el scan NO mira:
   - `confirm(...)`, `alert(...)`, `window.confirm` con texto español.
   - `aria-label`, `alt`, `placeholder`, `title` español residuales.
   - `setError('…')`, `setStatus('…')`, `throw new Error('… español')` **visibles** al usuario.
   - Strings dentro de arrays/constantes de datos que se rendericen (tabs, opciones).
3. Objetivo: `npm run i18n:scan` → **TOTAL: 0**.

## Parte B — Frente "código en inglés" (identificadores)

Independiente del copy. Traducir a inglés los **identificadores** (variables,
funciones, tipos, archivos) y **logs** que sigan en español, **archivo por archivo**.
**No** traducir comentarios. **No** tocar claves de BD/API.

- Buscar identificadores español: `grep -rnE "\b(cuadricula|medidas|recorte|borrar|guardar|enviar|cargar)\b" src/frontend --include=*.ts --include=*.tsx` (afinar).
- Renombrar con cuidado (TS detecta usos rotos vía `tsc`). Un módulo por commit.
- Prioridad baja vs. el copy; opcional si el tiempo aprieta.

## Parte C — Guardarraíl (que no reentre)

1. **ESLint `jsx-no-literals`** (warn) sobre `src/frontend/**/*.tsx`:
   ```jsonc
   // eslint config (override para frontend tsx)
   {
     "files": ["src/frontend/**/*.tsx"],
     "rules": {
       "react/jsx-no-literals": ["warn", {
         "noStrings": true,
         "allowedStrings": ["·", "×", "—", "%", "cm", "px"],
         "ignoreProps": false
       }]
     }
   }
   ```
   Empezar en `warn` (no romper CI). Ajustar `allowedStrings` para símbolos/unidades.
2. **CI con el detector**: añadir `npm run i18n:scan` como step que **falle** si
   `TOTAL > 0` (el script ya retorna exit 1 con hits).
3. (Opcional) Regla/script que marque identificadores español nuevos.

## Parte D — Limpieza

- Revisar claves i18n **huérfanas** (definidas y sin usar) y claves **faltantes**
  (usadas y sin definir → `t()` devuelve la clave, se ve fea). Un pequeño script puede
  cruzar `t('x.y')` usados vs. definidos en `es.ts`.
- Confirmar **paridad es/en**: toda clave en `es.ts` existe en `en.ts` y viceversa.

## Métrica de éxito

- `npm run i18n:scan` → **0**.
- `react/jsx-no-literals` activo (warn) en `src/frontend/**/*.tsx`.
- CI falla si reaparece copy hardcodeado.
- Paridad de claves es/en (sin huérfanas ni faltantes).
- ES↔EN traduce **toda** la app; tsc + tests verdes; ES idéntico.

## Cierre

Al terminar F5, marcar `plan-i18n-maestro.md` como **completed** y enlazar los
commits de F1–F5.
