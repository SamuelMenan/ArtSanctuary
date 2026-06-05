import { Layer, Group, Rect, Line, Text } from 'react-konva'
import { pxOf } from '@shared/lib/measure'
import type { CarnavalRule, CarnavalView } from '@shared/lib/workspaces/carnaval'
import { buildCarnavalGuide, type CarnavalGuide } from '../lib/carnavalGuide'

const COLOR = {
  max: '#16a34a', // verde: zona segura (límite máximo)
  min: '#d97706', // ámbar: mínimo reglamentario a alcanzar
  base: '#1f2937', // base (madera negra / cuadrada)
  human: '#e11d48', // rosa: figura humana de referencia
}

/** Contenido de una guía (rects/líneas/etiquetas) en un Group desplazable. */
function GuideGroup({ g, scale, offset }: { g: CarnavalGuide; scale: number; offset: { x: number; y: number } }) {
  const sw = (n: number) => n / scale // grosor de línea independiente del zoom
  const labelSize = 11 / scale

  return (
    <Group x={pxOf(offset.x)} y={pxOf(offset.y)}>
      {g.rects.map((r, i) => {
        const x = pxOf(r.x)
        const y = pxOf(r.y)
        const w = pxOf(r.w)
        const h = pxOf(r.h)
        if (r.kind === 'base') {
          return (
            <Rect key={`b${i}`} x={x} y={y} width={w} height={h} fill={COLOR.base} opacity={0.85} stroke={COLOR.base} strokeWidth={sw(1)} />
          )
        }
        const color = r.kind === 'max' ? COLOR.max : COLOR.min
        return (
          <Rect
            key={`r${i}`}
            x={x}
            y={y}
            width={w}
            height={h}
            stroke={color}
            strokeWidth={sw(r.kind === 'max' ? 2 : 1.5)}
            dash={r.kind === 'min' ? [pxOf(0.3), pxOf(0.3)] : undefined}
            fill={r.kind === 'max' ? COLOR.max : undefined}
            opacity={r.kind === 'max' ? 0.06 : 1}
          />
        )
      })}

      {/* Etiqueta envolvente máxima */}
      {g.rects
        .filter((r) => r.kind === 'max')
        .map((r, i) => (
          <Text
            key={`t${i}`}
            x={pxOf(r.x)}
            y={pxOf(r.y) - labelSize * 1.4}
            text={`máx ${r.w}×${r.h} cm`}
            fontSize={labelSize}
            fontFamily="monospace"
            fill={COLOR.max}
          />
        ))}

      {/* Figura humana de referencia */}
      {g.lines.map((l, i) => (
        <Line
          key={`h${i}`}
          points={[pxOf(l.x), pxOf(l.y), pxOf(l.x + l.w), pxOf(l.y)]}
          stroke={COLOR.human}
          strokeWidth={sw(1.5)}
          dash={[pxOf(0.4), pxOf(0.4)]}
        />
      ))}
      {g.lines.map((l, i) => (
        <Text
          key={`hl${i}`}
          x={pxOf(l.x + l.w) + labelSize * 0.4}
          y={pxOf(l.y) - labelSize * 0.6}
          text={l.label}
          fontSize={labelSize}
          fontFamily="monospace"
          fill={COLOR.human}
        />
      ))}
    </Group>
  )
}

/**
 * Guía reglamentaria de la vista (Fase 6). Capa no interactiva anclada al origen
 * del mundo. Verde = envolvente máxima (zona segura), ámbar punteado = mínimo,
 * gris = base obligatoria, rosa = figura humana. `offsets` (cm) coloca copias
 * IDÉNTICAS desplazadas a la derecha para explorar diseños alternativos.
 */
export default function CarnavalGuideLayer({
  rule,
  view,
  scale,
  baseOffset = { x: 0, y: 0 },
  offsets = [],
}: {
  rule: CarnavalRule
  view: CarnavalView
  scale: number
  baseOffset?: { x: number; y: number }
  offsets?: { x: number; y: number }[]
}) {
  const g = buildCarnavalGuide(rule, view)
  return (
    <Layer listening={false}>
      <GuideGroup g={g} scale={scale} offset={baseOffset} />
      {offsets.map((o, i) => (
        <GuideGroup key={`g${i}`} g={g} scale={scale} offset={o} />
      ))}
    </Layer>
  )
}
