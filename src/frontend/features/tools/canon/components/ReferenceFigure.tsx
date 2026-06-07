'use client'

import Image from 'next/image'

/** Vistas de la figura limpia (`public/canon/<canonId>/<view>.png`). */
export type View = 'frontal' | 'lateral' | 'posterior'

export const VIEWS: View[] = ['frontal', 'lateral', 'posterior']

interface Meta {
  w: number
  h: number
}

// Tamaño intrínseco real de cada lámina (px), por canon y vista. next/image lo
// usa para el aspecto; se renderiza por ALTURA (w auto) para preservar la
// proporción. Añadir un canon = una entrada aquí + las 3 imágenes en
// `public/canon/<id>/`. Mientras un canon no tenga láminas, cae a heroico.
const FIGURES: Record<string, Record<View, Meta>> = {
  heroic: {
    frontal: { w: 395, h: 1310 },
    lateral: { w: 216, h: 1312 },
    posterior: { w: 454, h: 1471 },
  },
}

/** Ids de canon que YA tienen las 3 láminas (para filtrar el selector). */
export const AVAILABLE_CANON_IDS: string[] = Object.keys(FIGURES)

/** Canon con láminas disponibles (cae a heroico mientras no haya más). */
export function resolveCanonId(canonId: string): string {
  return FIGURES[canonId] ? canonId : 'heroic'
}

/** Ruta de la lámina; comparte la misma resolución/fallback que el componente. */
export function figureSrc(canonId: string, view: View): string {
  return `/canon/${resolveCanonId(canonId)}/${view}.png`
}

/** Figura anatómica limpia (sin anotaciones). La interfaz (labels, divisiones,
 *  medidas) la dibuja `ProportionChart` por encima/al lado. */
export default function ReferenceFigure({
  canonId,
  view,
  alt,
  className,
}: {
  canonId: string
  view: View
  alt: string
  className?: string
}) {
  const id = resolveCanonId(canonId)
  const m = FIGURES[id][view]
  return (
    <Image
      src={`/canon/${id}/${view}.png`}
      alt={alt}
      width={m.w}
      height={m.h}
      priority
      className={className}
      style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
    />
  )
}
