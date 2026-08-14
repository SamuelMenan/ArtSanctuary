---
title: Theming (dark/light/system)
audience: frontend
status: stable
updated: 2026-08-13
owner: TBD
---

# Theming

Tres modos: `dark` (default), `light`, `system`. Persistencia DB + cookie.
Cliente resuelve `system` vía `matchMedia`. Ver
[ADR-0003](../adr/0003-system-theme-resolution.md).

## Flujo SSR + hidratación

```
┌────────────────────────────────────────────────────────────┐
│ 1. Request arrives                                         │
│    cookie:  artsanctuary-theme=system                      │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ 2. getRequestTheme() — lib/requestPreferences.ts           │
│    Devuelve 'system' literal.                              │
│    Si SSR aplica clase, usa defaultTheme='dark'.            │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼ HTML <html class="dark">
┌────────────────────────────────────────────────────────────┐
│ 3. Browser hydrate                                         │
│    AppPreferencesProvider monta useEffect matchMedia       │
│    systemDark = window.matchMedia('(prefers-color-scheme:  │
│                  dark)').matches                           │
│    resolvedTheme = system → systemDark ? 'dark' : 'light'  │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼ Aplica class 'dark' OR 'light' al <html>
                       │ Listener mq.addEventListener('change')
                       │ → actualiza si OS cambia mientras la página vive
```

## API

`AppPreferencesProvider` expone:

```ts
const { theme, locale, resolvedTheme, setTheme, setLocale, t } = usePreferences()
```

| Campo | Tipo | Notas |
|---|---|---|
| `theme` | `'dark' \| 'light' \| 'system'` | Preferencia raw del usuario |
| `resolvedTheme` | `'dark' \| 'light'` | Lo que efectivamente aplica al DOM |
| `setTheme(t)` | función | Actualiza estado + cookie + DB |

## Persistencia

| Capa | Valor |
|---|---|
| `localStorage.artsanctuary-theme` | raw (`dark`/`light`/`system`) |
| Cookie `artsanctuary-theme` | raw, max-age 1 año, SameSite Lax |
| DB `User.theme` | raw (si autenticado) |

## DOM

`AppPreferencesProvider` mantiene:

```tsx
document.documentElement.classList.remove('dark', 'light')
document.documentElement.classList.add(resolvedTheme)
document.documentElement.style.colorScheme = resolvedTheme
document.documentElement.lang = locale
```

Tailwind 4 usa `class="dark"` para `dark:` variants.

## Flash on system theme

**Síntoma**: usuario con cookie `system` y OS=light ve un flash dark→light al hidratar.

**Causa**: SSR no puede leer `prefers-color-scheme`.

**Mitigación actual**: aceptado en prototipo. SSR usa `defaultTheme = 'dark'`.

**Mitigación futura (recomendada)**: script inline en `<head>`:

```html
<script>
  (function() {
    try {
      var t = document.cookie.match(/artsanctuary-theme=([^;]+)/);
      var raw = t ? decodeURIComponent(t[1]) : 'dark';
      var resolved = raw === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : raw;
      document.documentElement.classList.add(resolved);
      document.documentElement.style.colorScheme = resolved;
    } catch (e) {}
  })();
</script>
```

Bloquea ~5ms antes de hydrate pero elimina flash. Pendiente integrar en
`src/app/layout.tsx`.

## next-themes

`package.json` incluye `next-themes` por si en el futuro se prefiere su
implementación. Hoy NO se usa — `AppPreferencesProvider` es el source of truth.

## Cambio de tema

`setTheme('light')`:

```ts
setThemeState('light')                             // estado React
// useEffect aplica DOM + cookie + localStorage
void persist(locale, 'light')                      // fire-and-forget PATCH /api/preferences
```

No requiere `router.refresh()` porque la clase se aplica directo en el DOM
(server components con `next-themes` style no son afectados — el CSS ya cubre
ambos casos).

## Limitaciones

- `system` no se persiste en SSR resolved (siempre dark inicialmente).
- Sin per-route override (no se puede forzar light en una página específica).
- Sin auto-switch por horario (e.g. dark de 19h-7h).

## Última verificación

- Fecha: 2026-05-18
- Commit: HEAD
