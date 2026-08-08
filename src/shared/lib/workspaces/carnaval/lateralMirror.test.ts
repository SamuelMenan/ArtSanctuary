import { describe, expect, it } from 'vitest'
import { lateralMirrorTarget, mirrorBoardObjectsForLateral } from './lateralMirror'
import type { BoardObject } from '@shared/lib/boards/types'

describe('lateral mirror', () => {
  it('resuelve la vista lateral opuesta', () => {
    expect(lateralMirrorTarget('lateralIzq')).toBe('lateralDer')
    expect(lateralMirrorTarget('lateralDer')).toBe('lateralIzq')
    expect(lateralMirrorTarget('frontal')).toBeNull()
  })

  it('espeja posición, rotación, puntos y alineación', () => {
    const objects: BoardObject[] = [
      {
        id: 'txt',
        type: 'text',
        x: 40,
        y: 12,
        w: 30,
        h: 10,
        rotation: 15,
        z: 1,
        align: 'left',
      },
      {
        id: 'line',
        type: 'line',
        x: -10,
        y: 0,
        w: 20,
        h: 8,
        rotation: -30,
        z: 2,
        points: [0, 0, 20, 8],
      },
      {
        id: 'img',
        type: 'image',
        x: 5,
        y: 4,
        w: 100,
        h: 40,
        rotation: 0,
        z: 3,
        flipX: false,
      },
    ]

    expect(mirrorBoardObjectsForLateral(objects)).toEqual([
      {
        ...objects[0],
        x: -70,
        rotation: -15,
        align: 'right',
      },
      {
        ...objects[1],
        x: -10,
        rotation: 30,
        points: [20, 0, 0, 8],
      },
      {
        ...objects[2],
        x: -105,
        rotation: 0,
        flipX: true,
      },
    ])
  })
})
