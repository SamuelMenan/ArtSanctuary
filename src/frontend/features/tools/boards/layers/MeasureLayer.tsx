import { Layer, Line } from 'react-konva'

export interface MeasureSegment {
  ax: number
  ay: number
  bx: number
  by: number
}

/** Capa de medición (regla): segmento A→B con extremos redondeados. */
export default function MeasureLayer({ measure, scale }: { measure: MeasureSegment; scale: number }) {
  return (
    <Layer listening={false}>
      <Line
        points={[measure.ax, measure.ay, measure.bx, measure.by]}
        stroke="#f43f5e"
        strokeWidth={1 / scale}
        dash={[4 / scale, 4 / scale]}
      />
      <Line points={[measure.ax, measure.ay, measure.ax, measure.ay]} stroke="#f43f5e" strokeWidth={3 / scale} lineCap="round" />
      <Line points={[measure.bx, measure.by, measure.bx, measure.by]} stroke="#f43f5e" strokeWidth={3 / scale} lineCap="round" />
    </Layer>
  )
}
