import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderImageGridCanvas } from './imageGridCanvas'

// Contexto 2D mínimo: sólo registra lo que se le pide dibujar.
function makeCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
  }
}

let ctx: ReturnType<typeof makeCtx>

beforeEach(() => {
  ctx = makeCtx()
  global.document = {
    createElement: () => ({ width: 0, height: 0, getContext: () => ctx }),
  } as unknown as Document
})

// Imagen de 27.3 × 19.1 cm con cuadro de 2 cm: NO es múltiplo del cuadro, así
// que la última columna (1.3 cm) y la última fila (1.1 cm) van cortadas.
const base = {
  img: {} as CanvasImageSource,
  wCm: 27.3,
  hCm: 19.1,
  gridCm: 2,
  color: '#ef4444',
  opacity: 80,
  showNumbers: true,
  showGrid: true,
  pxPerCm: 100,
}

describe('renderImageGridCanvas', () => {
  it('respeta la medida física del objeto: el lienzo mide lo que mide la imagen', () => {
    const out = renderImageGridCanvas(base)
    // 27.3 × 19.1 cm a 100 px/cm — NO 28 × 20 cm (el múltiplo del cuadro).
    expect(out.width).toBe(2730)
    expect(out.height).toBe(1910)
    expect(out.canvas.width).toBe(2730)
    expect(out.canvas.height).toBe(1910)
    // La imagen ocupa el lienzo entero: nada de bandas blancas ni recorte.
    expect(ctx.drawImage).toHaveBeenCalledWith(base.img, 0, 0, 2730, 1910)
  })

  it('cuenta las celdas con ceil: la última columna/fila queda cortada', () => {
    const out = renderImageGridCanvas(base)
    expect(out.cols).toBe(14) // 27.3 / 2 = 13.65 → 14
    expect(out.rows).toBe(10) // 19.1 / 2 = 9.55  → 10
    // 13 líneas interiores verticales + 9 horizontales, ninguna fuera del lienzo.
    const xs = ctx.moveTo.mock.calls.filter((c) => c[1] === 0).map((c) => c[0])
    const ys = ctx.moveTo.mock.calls.filter((c) => c[0] === 0).map((c) => c[1])
    expect(xs).toEqual([200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600])
    expect(ys).toEqual([200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800])
  })

  it('con padToCell extiende el lienzo al cuadro entero sin mover la imagen', () => {
    const out = renderImageGridCanvas({ ...base, padToCell: true })
    // El lienzo del PDF sí completa la celda (para cortar las hojas por el cuadro)…
    expect(out.width).toBe(2800)
    expect(out.height).toBe(2000)
    // …pero la imagen se sigue dibujando a su medida real.
    expect(ctx.drawImage).toHaveBeenCalledWith(base.img, 0, 0, 2730, 1910)
  })

  it('con showGrid: false no pinta líneas ni números', () => {
    renderImageGridCanvas({ ...base, showGrid: false })
    expect(ctx.stroke).not.toHaveBeenCalled()
    expect(ctx.fillText).not.toHaveBeenCalled()
    // El contorno gris de la imagen sí se mantiene (marca por dónde cortar).
    expect(ctx.strokeRect).toHaveBeenCalledTimes(1)
    expect(ctx.strokeRect).toHaveBeenCalledWith(0, 0, 2730, 1910)
  })

  it('omite la etiqueta de las celdas cortadas demasiado pequeñas', () => {
    // A 4 px/cm el cuadro entero mide 8 px: ninguna etiqueta cabe.
    renderImageGridCanvas({ ...base, pxPerCm: 4 })
    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})
