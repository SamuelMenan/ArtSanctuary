'use client'

import Image from 'next/image'
import { figureDims, figureSrc, type View } from '../lib/figureMeta'

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
  const m = figureDims(canonId, view)
  return (
    <Image
      src={figureSrc(canonId, view)}
      alt={alt}
      width={m.w}
      height={m.h}
      priority
      className={className}
      style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
    />
  )
}
