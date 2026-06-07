import { Layer, Shape } from 'react-konva'
import type Konva from 'konva'
import { buildGridLines } from '../lib/grid'

/** Capa de fondo: cuadrícula milimetrada (líneas menores + mayores).
 *
 *  AUTO-DIRIGIDA: el `sceneFunc` lee el transform VIVO del Stage (posición,
 *  zoom y tamaño) y calcula las líneas del viewport exacto en el momento de
 *  dibujar. Así no depende de estado React para el encuadre → el paneo
 *  imperativo (mover el Stage + `batchDraw`, sin re-render) redibuja la grilla
 *  correctamente, y el zoom por rueda (que sí pasa por React) también, porque
 *  cambiar el transform del Stage fuerza el redibujo de la capa.
 *
 *  Se dibuja con UN solo `Shape` (todas las líneas en un path) en vez de cientos
 *  de `<Line>`: el motor redibuja un nodo, no reconcilia cientos de componentes.
 */
export default function GridLayer({
  type,
  squareCm,
  color,
  opacity,
}: {
  /** Tipo de fondo; sólo se dibuja con 'grid'. */
  type: string
  /** Centímetros por cuadro mayor. */
  squareCm: number
  color: string
  /** Opacidad del fondo en 0–100. */
  opacity: number
}) {
  const draw = (ctx: Konva.Context, shape: Konva.Shape) => {
    if (type !== 'grid') return
    const stage = shape.getStage()
    if (!stage) return
    const scale = stage.scaleX()
    const lines = buildGridLines({
      type,
      squareCm,
      stageW: stage.width(),
      stageH: stage.height(),
      pos: { x: stage.x(), y: stage.y() },
      scale,
    })
    const a = opacity / 100
    // Menores (más tenues).
    if (lines.minor.length) {
      ctx.beginPath()
      for (const l of lines.minor) {
        ctx.moveTo(l.points[0], l.points[1])
        ctx.lineTo(l.points[2], l.points[3])
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 1 / scale
      ctx.globalAlpha = a * 0.45
      ctx.stroke()
    }
    // Mayores.
    if (lines.major.length) {
      ctx.beginPath()
      for (const l of lines.major) {
        ctx.moveTo(l.points[0], l.points[1])
        ctx.lineTo(l.points[2], l.points[3])
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 1.25 / scale
      ctx.globalAlpha = a
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  return (
    <Layer listening={false}>
      <Shape sceneFunc={draw} listening={false} perfectDrawEnabled={false} />
    </Layer>
  )
}
