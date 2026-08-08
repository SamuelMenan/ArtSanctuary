import type { BoardObject } from '@shared/lib/boards/types'
import type { CarnavalPlano } from './planos'

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
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i] ?? 0
    const y = points[i + 1] ?? 0
    mirrored.push(width - x, y)
  }
  return mirrored
}

function mirrorBoardObject(obj: BoardObject): BoardObject {
  const mirroredRotation = obj.rotation === 0 ? 0 : -obj.rotation
  const mirrored: BoardObject = {
    ...obj,
    x: -(obj.x + obj.w),
    rotation: mirroredRotation,
  }

  if (Array.isArray(obj.points) && obj.points.length > 0) {
    mirrored.points = mirrorPoints(obj.points, obj.w)
  }

  if (obj.align === 'left') mirrored.align = 'right'
  else if (obj.align === 'right') mirrored.align = 'left'
  if (obj.type === 'image') mirrored.flipX = !obj.flipX

  return mirrored
}

export function mirrorBoardObjectsForLateral(objects: BoardObject[]): BoardObject[] {
  return objects.map(mirrorBoardObject)
}
