/**
 * Tokens de animación compartidos. ÚNICA fuente de duraciones/easings/variantes
 * para mantener coherencia. Toda animación del proyecto usa `motion` (motion/react)
 * y, cuando aplique, estos tokens. Ver docs/frontend/animations.md.
 *
 * Sensibilidad editorial: movimientos cortos (≤0.32s), desplazamientos pequeños
 * (≤8px), sin rebotes exagerados.
 */
import type { Transition, Variants } from 'motion/react'

export const DURATION = { fast: 0.15, base: 0.22, slow: 0.32 } as const

// Curvas Material 3. `standard` para la mayoría; `emphasized` para entradas notorias.
export const EASE = {
  standard: [0.4, 0, 0.2, 1],
  emphasized: [0.2, 0, 0, 1],
} as const

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE.standard },
  base: { duration: DURATION.base, ease: EASE.standard },
  slow: { duration: DURATION.slow, ease: EASE.emphasized },
} satisfies Record<string, Transition>

/** Entrada/salida sutil para mensajes (errores, ayuda, medidor). */
export const fadeSlide: Variants = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0, transition: transition.fast },
  exit: { opacity: 0, y: -4, transition: transition.fast },
}

/** Apertura de popovers/menús contextuales: surge desde su ancla (origen
 *  vía `transformOrigin` en el elemento). Suave pero casi instantáneo. */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: transition.fast },
  exit: { opacity: 0, scale: 0.96, y: -4, transition: transition.fast },
}

/** Confirmación de campo válido. */
export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: transition.fast },
  exit: { opacity: 0, scale: 0.8, transition: transition.fast },
}

/** Transición de modo de AuthFlow (login ⟷ registro). Direccional. */
export function cardSwap(direction: 1 | -1): Variants {
  const offset = 16 * direction
  return {
    initial: { opacity: 0, x: offset },
    animate: { opacity: 1, x: 0, transition: transition.slow },
    exit: { opacity: 0, x: -offset, transition: transition.fast },
  }
}

/** Contenedor que escalona la entrada de sus hijos (usa `variants` en los hijos,
 *  p. ej. `fadeSlide`). Aplicar `initial="initial" animate="animate"` al padre. */
export const staggerParent: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

/** Trazo SVG que se dibuja (`pathLength 0→1`). Para plomada/Loomis/segmento de
 *  regla y líneas guía. El elemento debe ser un `<path>`/`<line>` con `motion`. */
export const lineDraw: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1, transition: { ...transition.slow, opacity: transition.fast } },
  exit: { opacity: 0, transition: transition.fast },
}

/** Marca horizontal que crece desde su centro (`scaleX 0→1`). Para marcas de
 *  ancho. Requiere `transformOrigin: 'center'`. */
export const growX: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: { scaleX: 1, opacity: 1, transition: transition.base },
  exit: { scaleX: 0, opacity: 0, transition: transition.fast },
}

/** Sacudida para errores de envío (credenciales incorrectas, etc.). */
export const shake = {
  x: [0, -4, 4, -4, 4, 0],
  transition: { duration: DURATION.slow, ease: EASE.standard },
}
