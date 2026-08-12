import type { BoardObject } from '@shared/lib/boards/types'
import type { CarnavalPlano } from './planos'

/** ID único para objetos del board (crypto.randomUUID con fallback). */
const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

export type LateralView = 'lateralIzq' | 'lateralDer'

const MIRROR_TARGET: Record<LateralView, LateralView> = {
  lateralIzq: 'lateralDer',
  lateralDer: 'lateralIzq',
}

export function isLateralView(view: unknown): view is LateralView {
  return view === 'lateralIzq' || view === 'lateralDer'
}

export function lateralMirrorTarget(view: CarnavalPlano): LateralView | null {
  return isLateralView(view) ? MIRROR_TARGET[view] : null
}

function mirrorPoints(points: number[], width: number): number[] {
  const mirrored: number[] = []

  // Process points in pairs (x, y) or handle individual points if needed
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] ?? 0
    const y = points[i + 1] ?? 0

    // Mirror the point: flip X coordinate and keep Y
    mirrored.push(width - x, y)

    // If there's an odd number of points, handle the last one (should be just Y or just X)
    if (i + 2 >= points.length) {
      const singlePoint = points[i] ?? 0

      // If it's a single value, assume it's X and mirror it
      if (points[i] !== undefined && points[i + 1] === undefined) {
        mirrored.push(width - singlePoint, 0)
      } else if (points[i] === undefined && points[i + 1] !== undefined) {
        mirrored.push(0, singlePoint)
      }
    }
  }

  return mirrored
}

function mirrorBoardObject(obj: BoardObject): BoardObject {
  const mirroredRotation = obj.rotation === 0 ? 0 : -obj.rotation

  // Mirror the board object coordinates and properties
  const mirrored: BoardObject = {
    ...obj,
    id: uid(),
    mirroredFrom: obj.id,
    x: -(obj.x + obj.w),
    rotation: mirroredRotation,
  }

  if (Array.isArray(obj.points) && obj.points.length > 0) {
    mirrored.points = mirrorPoints(obj.points, obj.w)
  }

  // Mirror alignment and flip properties
  if (obj.align === 'left') mirrored.align = 'right'
  else if (obj.align === 'right') mirrored.align = 'left'

  if (obj.type === 'image') {
    mirrored.flipX = !obj.flipX
  }

  return mirrored
}

export function mirrorBoardObjectsForLateral(objects: BoardObject[]): BoardObject[] {
  return objects.map(mirrorBoardObject)
}


