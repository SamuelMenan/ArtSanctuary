---
title: Design system
audience: frontend
status: stable
updated: 2026-08-13
owner: TBD
---

# Design system

Estética **oscura, editorial, archivo museo**. Manrope display + JetBrains Mono
labels. Tailwind 4 con tokens en CSS custom properties.

## Tokens

Definidos en `src/app/globals.css` `:root`. Tailwind 4 los consume via
`@theme inline`. **No** hay `tailwind.config.ts`.

### Colores Material 3 (custom)

| Token | Hex | Uso |
|---|---|---|
| `--color-background` | `#131313` | Fondo principal |
| `--color-surface` | `#131313` | Igual a background (sin lift) |
| `--color-surface-container-lowest` | `#0e0e0e` | Tarjetas hundidas |
| `--color-surface-container-low` | `#1c1b1b` | Bloques planos |
| `--color-surface-container` | `#201f1f` | Bloques default |
| `--color-surface-container-high` | `#2a2a2a` | Inputs |
| `--color-surface-container-highest` | `#353534` | Bordes / divisores fuertes |
| `--color-primary` | `#ffffff` | Texto principal, CTAs primary |
| `--color-on-primary` | `#2f3131` | Texto sobre botón primary |
| `--color-primary-container` | `#e2e2e2` | Hover state CTAs |
| `--color-on-surface` | `#e5e2e1` | Texto cuerpo |
| `--color-on-surface-variant` | `#c4c7c8` | Texto secundario |
| `--color-outline` | `#8e9192` | Borde fuerte |
| `--color-outline-variant` | `#444748` | Borde sutil / divisor |
| `--color-error` | `#ffb4ab` | Texto error |
| `--color-error-container` | `#93000a` | Fondo destructivo |

**Convención**: `--color-on-X` = texto que va sobre fondo `--color-X`. WCAG AAA
en todos los pares principales.

### Tipografía

| Token | Familia | Uso |
|---|---|---|
| `--font-display-lg` | Manrope | Headlines display (h1 grandes) |
| `--font-headline-md` | Manrope | Section headers |
| `--font-body-md` | Manrope | Cuerpo de texto |
| `--font-label-sm` | JetBrains Mono | Eyebrows, badges, captions |
| `--font-sans` | Manrope | Default sans |
| `--font-mono` | JetBrains Mono | Default monospace |

### Escalas de tamaño

| Token | Valor | Uso |
|---|---|---|
| `--text-display-lg` | 48px / 1.1 / -0.02em | h1 display |
| `--text-headline-md` | 24px / 1.3 | h2 / h3 |
| `--text-headline-md-mobile` | 20px / 1.3 | h2 mobile |
| `--text-body-md` | 16px / 1.6 | cuerpo |
| `--text-label-sm` | 12px / 1 / 0.05em | labels mono |

## Patrones visuales

### Eyebrow

Línea pequeña sobre el título, en mono uppercase con tracking ancho:

```tsx
<span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-on-surface-variant)] opacity-70">
  — TU SANTUARIO
</span>
```

Prefijo `—` o `─` separa visualmente del contenido.

### Chip / Badge

```tsx
<span className="font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-sm border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
  FREE
</span>
```

Variants: `default`, `accent` (border primary), `muted` (sin borde).

### Metric card

```tsx
<div className="px-3 py-3 flex flex-col gap-0.5 bg-[var(--color-surface-container-lowest)]">
  <span className="font-sans font-semibold text-xl text-[var(--color-primary)] tabular-nums">12</span>
  <span className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-70">OBRAS</span>
</div>
```

Agrupar varias con `divide-x divide-[var(--color-outline-variant)]` → divisores hairline naturales.

### Pull quote (bio)

```tsx
<blockquote className="border-l-2 border-[var(--color-primary)] pl-3">
  <p className="font-sans text-base leading-relaxed whitespace-pre-line">
    {bio}
  </p>
</blockquote>
```

### CTA primary

```tsx
<button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-sm hover:bg-[var(--color-primary-container)] transition-colors">
  Subir obra
</button>
```

### CTA ghost

```tsx
<button className="border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-sm hover:border-[var(--color-primary)] transition-colors">
  Editar perfil
</button>
```

### CTA danger

```tsx
<button className="border border-[var(--color-error-container)] text-[var(--color-error)] font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3 rounded-sm hover:bg-[var(--color-error-container)]/20 transition-colors">
  Eliminar cuenta
</button>
```

### Input

```tsx
<input className="w-full bg-[var(--color-surface-container)] border border-[var(--color-surface-container-high)] rounded-sm px-4 py-3 text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-sans" />
```

Estado de error: añadir `border-[var(--color-error)] focus:border-[var(--color-error)]`.

### Toggle (switch)

`role=switch`, `aria-checked`. Ver `src/frontend/features/settings/Toggle.tsx`.

## Composición editorial

Reglas no escritas que se han establecido:

1. **Densidad alta**: padding compacto (`px-3 py-2`, `gap-2/3`). Evitar
   `gap-10/16` salvo en headers grandes.
2. **Border-as-divider**: usar `border-b border-[var(--color-outline-variant)]`
   en vez de `<hr>`.
3. **Containers con border**: agrupar bloques relacionados dentro de un
   contenedor con border. Hero + Meta block lo aprovechan compartiendo `-mt-px`.
4. **`tabular-nums`** en métricas para alineación vertical.
5. **Padding fechas/IDs**: usar `padStart(2, '0')` (e.g. "07 OBRAS") para
   estética catálogo museo.
6. **Eyebrow `—`** consistente en cada bloque.

## Scrollbars

Todo contenedor con scroll interno lleva la clase **`custom-scrollbar`**,
definida en `src/app/globals.css` (capa `utilities`). Barra fina de 8px, pista
transparente y thumb en `--color-outline-variant` que pasa a `--color-outline`
al hacer hover sobre el contenedor. Cubre WebKit (`::-webkit-scrollbar-*`) y
Firefox (`scrollbar-width` / `scrollbar-color`).

La barra principal de la ventana recibe el mismo tratamiento en la capa `base`
(regla sobre `html`, 10px). Como el tema se aplica con `html.light` / `html.dark`
y esas clases **redefinen los tokens en el propio `html`**, la barra sigue al
tema sin necesidad de reglas separadas por tema.

Dos contenedores **ocultan la barra a propósito** y no deben llevar la clase:
`CanonMeasuresPanel` y `ToolActiveLayout`, ambos con
`[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`.

> Aviso: durante meses `custom-scrollbar` se usó en 14 componentes **sin estar
> definida en ninguna parte** — era una clase muerta, y esos paneles mostraban
> la barra por defecto del navegador. Se implementó el 2026-08-14. Si una clase
> `custom-*` no aparece en `globals.css`, no existe.

## Movimiento / Motion

La UI debe transmitir calidad con **animaciones suaves, sutiles, sin saturar**, que
mejoren la navegabilidad y comodidad. **Norma del proyecto: toda animación se implementa
con la librería `motion` (`motion/react`)** — es el único sistema de animación, para evitar
conflictos. Prohibido añadir `@keyframes` CSS nuevos o `animate-[...]` para mover componentes.

Tokens en [`src/frontend/shared/motion/tokens.ts`](../../src/frontend/shared/motion/tokens.ts);
caso de referencia: la transición login ⟷ registro de `AuthFlow`.

Detalle completo (principios, patrones, accesibilidad `prefers-reduced-motion`, checklist):
ver **[`animations.md`](animations.md)**.

## Anti-patterns

❌ `text-blue-500`, `text-gray-400`: usar siempre `text-[var(--color-NAME)]`.
❌ `@keyframes` CSS o `animate-[...]` para animar: usar `motion`. Ver [`animations.md`](animations.md).
❌ Shadows grandes / blurs / glows: rompen la estética minimal.
❌ `gap-10`+ entre elementos relacionados.
❌ `font-bold` Manrope: usar `font-semibold` (peso 600).
❌ Mezclar cases en labels: siempre uppercase + tracking ancho.
❌ Bordes redondeados grandes: `rounded-sm` (2px) o `rounded-full` para avatares.

## Última verificación

- Fecha: 2026-06-04
- Commit: HEAD
