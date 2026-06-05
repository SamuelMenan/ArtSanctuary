import { Layer, Group, Rect, Text } from 'react-konva'
import { pxOf } from '@shared/lib/measure'
import type { CarnavalRule } from '@shared/lib/workspaces/carnaval'
import { buildBaseFootprint, type GuideRect } from '../lib/carnavalGuide'

/** Huella de base en un Group desplazable (para guías colocables). */
function BaseGroup({ r, scale, offset }: { r: GuideRect; scale: number; offset: { x: number; y: number } }) {
  const x = pxOf(r.x)
  const y = pxOf(r.y)
  const w = pxOf(r.w)
  const h = pxOf(r.h)
  const labelSize = 11 / scale
  return (
    <Group x={pxOf(offset.x)} y={pxOf(offset.y)}>
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
      <Text x={x} y={y - labelSize * 1.4} text={`Base ${r.w}×${r.h} cm`} fontSize={labelSize} fontFamily="monospace" fill="#1f2937" />
    </Group>
  )
}

/**
 * Guía de planos especiales (bastidores/jugadores, Fase 5): solo la huella de
 * la base vista desde arriba. `offsets` (cm) coloca copias idénticas a la
 * derecha para explorar alternativas.
 */
export default function CarnavalBaseLayer({
  rule,
  scale,
  baseOffset = { x: 0, y: 0 },
  offsets = [],
}: {
  rule: CarnavalRule
  scale: number
  baseOffset?: { x: number; y: number }
  offsets?: { x: number; y: number }[]
}) {
  const r = buildBaseFootprint(rule)
  return (
    <Layer listening={false}>
      <BaseGroup r={r} scale={scale} offset={baseOffset} />
      {offsets.map((o, i) => (
        <BaseGroup key={`b${i}`} r={r} scale={scale} offset={o} />
      ))}
    </Layer>
  )
}
