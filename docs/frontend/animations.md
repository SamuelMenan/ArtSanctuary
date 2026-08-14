---
title: Animaciones y movimiento
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Animaciones y movimiento

Guía canónica de animación de ArtSanctuary. La lee tanto el equipo como el MCP/Claude
para entender **qué se anima, cómo y con qué límites**.

## Principio rector

Animaciones **sutiles** que mejoran la navegabilidad y la comodidad del usuario, **nunca
para saturar**. El movimiento debe explicar un cambio de estado (qué apareció, qué se fue,
a dónde fue), no decorar. Si una animación no aclara nada, no va.

Coherente con la estética **oscura, editorial, archivo museo** (ver
[`design-system.md`](design-system.md)): movimientos cortos, desplazamientos pequeños,
sin rebotes ni glows.

## Norma dura: SIEMPRE `motion`

> **Toda** animación se implementa con la librería [`motion`](https://motion.dev)
> (`import { ... } from 'motion/react'`, sucesora de framer-motion). **Es el único
> sistema de animación del proyecto.**

Motivo: evitar conflictos entre sistemas que compitan por las mismas propiedades.

**Prohibido en UI nueva:**
- Añadir `@keyframes` CSS nuevos para animar componentes.
- Clases `animate-[...]` arbitrarias de Tailwind para movimiento.
- Otras librerías de animación (GSAP, react-spring, AOS, etc.).

Excepción acotada: micro-transiciones de color/borde con `transition-colors` de Tailwind
en hover/focus de controles simples siguen permitidas (no son "animación" orquestada).
Cualquier movimiento de posición/opacidad/escala/tamaño → `motion`.

## Tokens

Fuente única: [`src/frontend/shared/motion/tokens.ts`](../../src/frontend/shared/motion/tokens.ts).
Importar siempre desde ahí; no hardcodear duraciones/easings sueltos.

| Token | Valor | Uso |
|---|---|---|
| `DURATION.fast` | 0.15s | Mensajes, iconos, hover/tap |
| `DURATION.base` | 0.22s | Cambios de tamaño, barras |
| `DURATION.slow` | 0.32s | Entradas notorias, cambio de modo |
| `EASE.standard` | `[0.4,0,0.2,1]` | Curva por defecto (Material 3) |
| `EASE.emphasized` | `[0.2,0,0,1]` | Entradas con énfasis |
| `transition.{fast,base,slow}` | — | Atajos `{duration, ease}` |
| `fadeSlide` | opacity + y(-4px) | Entrada/salida de mensajes |
| `popIn` | opacity + scale(0.8→1) | Confirmación de campo válido |
| `cardSwap(dir)` | opacity + x(±16px) | Transición login ⟷ registro |
| `shake` | x `[0,-4,4,-4,4,0]` | Error de envío |
| `scaleIn` | escala + opacity | Entrada de elementos puntuales |
| `staggerParent` | orquesta hijos en cascada | Listas y grids |
| `lineDraw` | trazo progresivo | Líneas de cota / guías |
| `growX` | ancho progresivo | Barras de progreso |

> Los 4 últimos existen y se usan, pero faltaban en esta tabla — añadidos
> 2026-08-14 tras verificar `tokens.ts`. Todos los tokens documentados aquí
> existen con ese nombre y valor.

Límites: duración ≤ 0.32s, desplazamiento ≤ 16px (≤ 8px en mensajes), sin `spring`
<br>_(Nota: la cabecera de `tokens.ts` enuncia ≤8px como norma general; el
único token que llega a 16px es `cardSwap`. Discrepancia menor sin resolver.)_
con rebote alto.

## Cuándo animar / cuándo NO

| ✅ Animar | ❌ No animar |
|---|---|
| Entrada/salida de errores y ayudas | Decoración sin cambio de estado |
| Aparición de medidor de fortaleza | Parallax / movimiento en scroll |
| Cambio de modo (login ⟷ registro) | Loops infinitos / "atención" |
| Feedback de acción (hover/tap, ✓ éxito) | Animar texto largo de párrafos |
| Reflow de altura al cambiar contenido (`layout`) | Auto-play que distraiga del foco |

## Accesibilidad

Respetar `prefers-reduced-motion` **siempre**:

- Envolver el árbol relevante con `<MotionConfig reducedMotion="user">` — motion reduce
  automáticamente las animaciones de transform/layout para usuarios con esa preferencia.
- Para lógica condicional puntual usar el hook `useReducedMotion()`.

Ver también [`accessibility.md`](accessibility.md) (focus visible, `role=alert`/`status`
en banners animados, no usar color como única señal).

## Patrones de referencia

### Entrada/salida de un mensaje

```tsx
import { AnimatePresence, motion } from 'motion/react'
import { fadeSlide } from '@frontend/shared/motion/tokens'

<AnimatePresence mode="wait" initial={false}>
  {error && (
    <motion.p key="error" role="alert" variants={fadeSlide}
      initial="initial" animate="animate" exit="exit">
      {error}
    </motion.p>
  )}
</AnimatePresence>
```

Reservar espacio (`min-h`) en la zona de mensaje para evitar saltos de layout.

### Reflow suave de altura

```tsx
<motion.div layout>{children}</motion.div>
```

### Feedback de botón

```tsx
<motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
  transition={transition.fast}>…</motion.button>
```

Desactivar `whileHover/whileTap` cuando el botón está `disabled`.

### Caso de referencia: `AuthFlow` (transición de elemento compartido)

[`src/frontend/features/auth/screens/AuthFlow.tsx`](../../src/frontend/features/auth/screens/AuthFlow.tsx)
unifica Login y Registro en un componente con `mode`. El panel lateral queda fijo y solo la
tarjeta del formulario hace `cardSwap` con `AnimatePresence mode="wait"`; la URL se sincroniza
con `history.replaceState` (no `router.push`, que remontaría y mataría la animación) y se
respeta back/forward con `popstate`. Es el patrón a seguir para transiciones entre vistas
que comparten layout.

## Anti-patterns

❌ `@keyframes` CSS nuevos o `animate-[...]` para mover componentes → usar `motion`.
❌ Duraciones > 0.32s o springs con rebote alto.
❌ Animar sin `AnimatePresence` lo que entra **y** sale (la salida se pierde).
❌ Cambiar de ruta con `router.push` cuando se quiere una transición sin remontar.
❌ Olvidar `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`).
❌ Layout shift por no reservar espacio del elemento animado.

## Checklist para PRs

- [ ] ¿La animación usa `motion` y tokens de `shared/motion/tokens.ts`?
- [ ] ¿Aclara un cambio de estado (no es decorativa)?
- [ ] ¿Duración ≤ 0.32s y desplazamiento dentro de límites?
- [ ] ¿Entra y sale con `AnimatePresence` si es condicional?
- [ ] ¿Respeta `prefers-reduced-motion`?
- [ ] ¿Sin layout shift?

## Última verificación

- Fecha: 2026-06-04
- Commit: HEAD
