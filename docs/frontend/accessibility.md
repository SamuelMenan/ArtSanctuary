---
title: Accessibility patterns
audience: frontend
status: stable
updated: 2026-08-13
owner: TBD
---

# Accessibility patterns

Convenciones a11y aplicadas. Reutilizar estos patterns en código nuevo.

## Form controls

### Label ligado

```tsx
<label htmlFor="email" className={labelCls}>Email</label>
<input id="email" type="email" ... />
```

Nunca dejar input sin label. Si visual no requiere label, usar `sr-only`:

```tsx
<label htmlFor="search" className="sr-only">Buscar</label>
<input id="search" aria-label="Buscar" type="search" />
```

### Error por campo

```tsx
<input
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
  className={inputCls + (error ? inputErrCls : '')}
/>
{error && (
  <p id="email-error" className="text-xs text-[var(--color-error)] font-mono">
    {error}
  </p>
)}
```

### `autoComplete`

| Campo | Valor |
|---|---|
| Password actual | `current-password` |
| Password nueva | `new-password` |
| Confirm password | `new-password` |
| Email | `email` |
| Username login | `username` |
| Avatar URL | `off` |

## Toggle / Switch

`src/frontend/features/settings/Toggle.tsx`:

```tsx
<button
  type="button"
  role="switch"
  aria-checked={checked}
  disabled={disabled}
  onClick={() => onChange(!checked)}
  className="... focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ..."
>
  <span className="sr-only">{label}</span>
  <span aria-hidden className="..." />
</button>
```

Clave: `role=switch` + `aria-checked` boolean. `sr-only` para label
oculto-visualmente.

## Status / Alert banners

`src/frontend/features/settings/StatusBanner.tsx`:

```tsx
<div
  role={isError ? 'alert' : 'status'}
  aria-live="polite"
  className="..."
>
  {message}
</div>
```

- `role=alert` → screen reader interrumpe inmediato.
- `role=status` + `aria-live=polite` → anuncio sin interrumpir.

## Modal / Dialog

`src/frontend/features/profile/FollowListModal.tsx` es la referencia.

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onClick={onBackdropClick}
>
  <div ref={dialogRef}>
    <header>
      <h2 id="modal-title">{title}</h2>
      <button ref={closeRef} aria-label="Cerrar">✕</button>
    </header>
    ...
  </div>
</div>
```

Comportamiento obligatorio:
1. **Escape key** cierra (listener global mientras abierto).
2. **Click fuera** cierra (`e.target === e.currentTarget` en backdrop).
3. **Focus inicial** en botón close.
4. **Scroll lock**: `document.body.style.overflow = 'hidden'` al abrir,
   restaurar al cerrar.
5. **Carga perezosa**: fetch al abrir, no al montar.

Focus trap completo (Tab loop) pendiente en TODO — actualmente solo focus inicial.

## Navegación por teclado

| Tecla | Comportamiento esperado |
|---|---|
| `Tab` | Avanza por elementos focusables visibles |
| `Shift+Tab` | Retrocede |
| `Enter` | Submit form / activar botón |
| `Space` | Toggle switch, activar botón |
| `Esc` | Cerrar modal, cancelar acción |

Componentes no estándar (custom `div` con `onClick`) deben tener:
- `role` apropiado
- `tabIndex={0}`
- Handler `onKeyDown` para Enter/Space

## Focus visible

Todos los elementos interactivos deben tener focus visible.

Default Tailwind: `focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]`.

O variante `focus-visible:` para mostrar solo con teclado, no con click:

```tsx
focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
```

## Imágenes

```tsx
<Image src={avatarUrl} alt={`Avatar de ${name}`} width={140} height={140} />
```

- `alt` descriptivo (no "imagen" o "foto").
- `alt=""` solo si la imagen es **decorativa** (e.g. patrón hatch en empty state).
- `aria-hidden` en elementos decorativos no-img.

## Contraste

- Texto principal: `#fff` sobre `#0e0e0e` → WCAG AAA.
- Texto secundario: `#c4c7c8` sobre `#0e0e0e` → AAA.
- Hint/opacity 0.7: validar caso por caso. Usar opacity solo en texto NO crítico.

## Patrones específicos del proyecto

### Eyebrow

Eyebrow `<span>` con prefix `—`:

```tsx
<span aria-hidden className="...">─</span>
<h2>{title}</h2>
```

Usar `aria-hidden` en separadores tipográficos.

### Chip / Badge

Sin role custom. Texto plano dentro de `<span>`:

```tsx
<span title="Email completo si está truncado" className="chip">
  user@example.com
</span>
```

`title` solo cuando el texto puede truncar (`truncate`).

### Métric clicable

`FollowStats` con layout `cells`:

```tsx
<button
  type="button"
  onClick={() => setOpen('followers')}
  className="... focus-visible:bg-[var(--color-surface-container)]"
>
  <span>{value}</span>
  <span>{label}</span>
</button>
```

Mantener `<button>` nativo, no `<div onClick>`.

## Anti-patterns

❌ `<div onClick>` para acciones — usar `<button>`.
❌ `placeholder` como sustituto de `<label>`.
❌ Modal sin `Escape` handler.
❌ Form sin `<label htmlFor>` pareado.
❌ Color como única señal (ej. error solo rojo sin texto/icono).
❌ Spinner sin `aria-busy` o `role=status`.
❌ Click target < 44x44px en mobile.

## Última verificación

- Fecha: 2026-05-18
- Commit: HEAD
