import { Layer, Rect, Text } from 'react-konva'
import { pxOf } from '@shared/lib/measure'
import type { CarnavalRule } from '@shared/lib/workspaces/carnaval'
import { buildBaseFootprint } from '../lib/carnavalGuide'

/**
 * Guía de planos especiales (bastidores/jugadores, Fase 5): solo la huella de
 * la base vista desde arriba, sin envolventes ni validación de ejes. El
 * artesano organiza soportes o zonas de jugadores dentro de ella.
 */
export default function CarnavalBaseLayer({
  rule,
  scale,
}: {
  rule: CarnavalRule
  scale: number
}) {
  const r = buildBaseFootprint(rule)
  const x = pxOf(r.x)
  const y = pxOf(r.y)
  const w = pxOf(r.w)
  const h = pxOf(r.h)
  const labelSize = 11 / scale

  return (
    <Layer listening={false}>
      <Rect
        x={x}
        y={y}
        width={w}
        height={h}
        stroke="#1f2937"
        strokeWidth={2 / scale}
        dash={[pxOf(0.5), pxOf(0.5)]}
        fill="#1f2937"
        opacity={0.05}
      />
      <Text
        x={x}
        y={y - labelSize * 1.4}
        text={`Base ${r.w}×${r.h} cm`}
        fontSize={labelSize}
        fontFamily="monospace"
        fill="#1f2937"
      />
    </Layer>
  )
}
