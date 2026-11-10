import { describe, it, expect } from 'vitest'
import { snapResizeRect, draggedSides, type Rect } from './resizeSnap'
import { NO_MODIFIERS, type ResizeModifiers } from '../hooks/useResizeModifiers'

/** Imán de rejilla de 10 px, el mismo en los dos ejes. */
const snap10 = (v: number) => Math.round(v / 10) * 10

const call = (old: Rect, next: Rect, mode: ResizeModifiers = NO_MODIFIERS, anchor: string | null = null) =>
  snapResizeRect(old, next, { anchor, mode, snapX: snap10, snapY: snap10, min: 5 })

const CENTERED: ResizeModifiers = { keepRatio: false, centered: true }
const RATIO: ResizeModifiers = { keepRatio: true, centered: false }

// Caja de 100×100 centrada en (50,50).
const OLD: Rect = { left: 0, right: 100, top: 0, bottom: 100 }

describe('draggedSides', () => {
  it('lee el ancla activa de Konva', () => {
    expect(draggedSides('top-left', OLD, OLD)).toEqual({ x: 'lo', y: 'lo' })
    expect(draggedSides('bottom-right', OLD, OLD)).toEqual({ x: 'hi', y: 'hi' })
    expect(draggedSides('middle-left', OLD, OLD)).toEqual({ x: 'lo', y: null })
    expect(draggedSides('top-center', OLD, OLD)).toEqual({ x: null, y: 'lo' })
  })

  it('sin ancla cae a deducirlo por el borde que se movió', () => {
    const next = { ...OLD, right: 137 }
    expect(draggedSides(null, OLD, next)).toEqual({ x: 'hi', y: null })
  })
})

describe('imán sin modificador', () => {
  it('imanta el borde arrastrado y deja quieto el opuesto', () => {
    const r = call(OLD, { ...OLD, right: 137 }, NO_MODIFIERS, 'middle-right')
    expect(r).toEqual({ left: 0, right: 140, top: 0, bottom: 100 })
  })

  it('el borde opuesto NO se imanta aunque esté fuera de la rejilla', () => {
    const old = { left: 3, right: 100, top: 0, bottom: 100 }
    const r = call(old, { ...old, right: 137 }, NO_MODIFIERS, 'middle-right')
    expect(r.left).toBe(3)
  })

  it('respeta el tamaño mínimo moviendo el borde arrastrado', () => {
    const r = call(OLD, { ...OLD, left: 99 }, NO_MODIFIERS, 'middle-left')
    expect(r.right - r.left).toBe(5)
    expect(r.right).toBe(100) // el borde quieto sigue quieto
  })
})

describe('centrado (Shift)', () => {
  it('crece igual por los dos lados: el centro no se mueve', () => {
    const r = call(OLD, { left: -37, right: 137, top: 0, bottom: 100 }, CENTERED, 'middle-right')
    expect((r.left + r.right) / 2).toBe(50)
    expect(r.right - 50).toBe(50 - r.left)
  })

  it('el borde arrastrado aterriza en la rejilla', () => {
    const r = call(OLD, { left: -37, right: 137, top: 0, bottom: 100 }, CENTERED, 'middle-right')
    expect(r.right).toBe(140)
    expect(r.left).toBe(-40)
  })

  it('arrastrando el borde bajo, el alto también se espeja', () => {
    const r = call(OLD, { ...OLD, top: -37, bottom: 137 }, CENTERED, 'bottom-center')
    expect(r.bottom).toBe(140)
    expect(r.top).toBe(-40)
    expect((r.top + r.bottom) / 2).toBe(50)
  })

  it('en esquina centra los DOS ejes a la vez', () => {
    const r = call(OLD, { left: -37, right: 137, top: -37, bottom: 137 }, CENTERED, 'bottom-right')
    expect((r.left + r.right) / 2).toBe(50)
    expect((r.top + r.bottom) / 2).toBe(50)
  })

  // La regresión concreta: antes se imantaban los dos bordes por separado, cada
  // uno a su línea, y el centro se desplazaba en cada tirón del imán.
  it('el centro no deriva aunque la caja vieja no cuadre con la rejilla', () => {
    const old = { left: 3, right: 97, top: 0, bottom: 100 } // centro en 50
    const r = call(old, { left: -34, right: 134, top: 0, bottom: 100 }, CENTERED, 'middle-right')
    expect((r.left + r.right) / 2).toBe(50)
  })
})

describe('proporción (Ctrl/⌘)', () => {
  it('conserva la razón original tras imantar', () => {
    const old: Rect = { left: 0, right: 200, top: 0, bottom: 100 } // 2:1
    const r = call(old, { ...old, right: 337, bottom: 190 }, RATIO, 'bottom-right')
    expect((r.right - r.left) / (r.bottom - r.top)).toBeCloseTo(2, 5)
  })

  it('el ancla opuesta se queda fija', () => {
    const old: Rect = { left: 0, right: 200, top: 0, bottom: 100 }
    const r = call(old, { ...old, right: 337, bottom: 190 }, RATIO, 'bottom-right')
    expect(r.left).toBe(0)
    expect(r.top).toBe(0)
  })

  it('no aplica a las anclas medias (un solo eje, como en Konva)', () => {
    const old: Rect = { left: 0, right: 200, top: 0, bottom: 100 }
    const r = call(old, { ...old, right: 337 }, RATIO, 'middle-right')
    expect(r.bottom - r.top).toBe(100) // el alto no se toca
  })

  it('combinado con centrado, conserva razón Y centro', () => {
    const old: Rect = { left: 0, right: 200, top: 0, bottom: 100 }
    const both: ResizeModifiers = { keepRatio: true, centered: true }
    const r = snapResizeRect(
      old,
      { left: -37, right: 237, top: -37, bottom: 137 },
      { anchor: 'bottom-right', mode: both, snapX: snap10, snapY: snap10, min: 5 },
    )
    expect((r.left + r.right) / 2).toBe(100)
    expect((r.top + r.bottom) / 2).toBe(50)
    expect((r.right - r.left) / (r.bottom - r.top)).toBeCloseTo(2, 5)
  })
})
