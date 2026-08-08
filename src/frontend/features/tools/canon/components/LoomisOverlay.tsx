'use client'

import { motion } from 'motion/react'
import { lineDraw, staggerParent } from '@frontend/shared/motion/tokens'
import { getLandmarks } from '@shared/lib/canon/landmarks'
import { figureDims, type View } from '../lib/figureMeta'

/** Construcción Loomis de la cabeza + plomada (eje de aplomo vertical), dibujada
 *  como SVG en las coordenadas de píxel de la lámina (viewBox = dims reales), así
 *  los círculos quedan circulares y todo calza con la figura. Geométrico: no
 *  necesita assets. La pose es simétrica → la plomada cae en la línea media. */
export default function LoomisOverlay({ canonId, view }: { canonId: string; view: View }) {
  const { w, h } = figureDims(canonId, view)
  const cx = w / 2
  const chinFrac = getLandmarks(canonId, view).find((l) => l.key === 'cabeza')?.frac ?? 0.12
  const chinY = chinFrac * h

  // Cabeza: bola craneal (arriba) + mandíbula a la barbilla + tercios faciales.
  const ballR = chinY * 0.42
  const ballCy = ballR
  const browY = chinY * 0.5
  const noseY = chinY * 0.76
  const jawHalf = ballR * 0.82

  const stroke = 'var(--color-tertiary)'
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {/* Las líneas/círculo se DIBUJAN escalonados (pedagogía de construcción). */}
      <motion.g variants={staggerParent} initial="initial" animate="animate" fill="none" stroke={stroke} strokeWidth={Math.max(1, w / 260)} opacity={0.85}>
        {/* Plomada (aplomo) */}
        <motion.line variants={lineDraw} x1={cx} y1={0} x2={cx} y2={h} strokeDasharray={`${w / 90} ${w / 90}`} />
        {/* Bola craneal */}
        <motion.circle variants={lineDraw} cx={cx} cy={ballCy} r={ballR} />
        {/* Mandíbula → barbilla */}
        <motion.line variants={lineDraw} x1={cx - jawHalf} y1={browY} x2={cx} y2={chinY} />
        <motion.line variants={lineDraw} x1={cx + jawHalf} y1={browY} x2={cx} y2={chinY} />
        {/* Tercios faciales (ceja / nariz) + barbilla */}
        <motion.line variants={lineDraw} x1={cx - jawHalf} y1={browY} x2={cx + jawHalf} y2={browY} />
        <motion.line variants={lineDraw} x1={cx - jawHalf * 0.7} y1={noseY} x2={cx + jawHalf * 0.7} y2={noseY} />
        <motion.line variants={lineDraw} x1={0} y1={chinY} x2={w} y2={chinY} strokeDasharray={`${w / 120} ${w / 120}`} opacity={0.5} />
      </motion.g>
    </svg>
  )
}
