import { vi, describe, it, expect, beforeEach } from 'vitest'
import { exportImageGridPdf } from './imageGridPdf'
import { createScaler } from '@shared/lib/measure'
import type { BoardObject } from '@shared/lib/boards/types'

// Mock jsPDF methods
const mockAddPage = vi.fn()
const mockAddImage = vi.fn()
const mockSave = vi.fn()
const mockText = vi.fn()
const mockSetFontSize = vi.fn()
const mockSetTextColor = vi.fn()

// Constructor de clase mock para jsPDF
class MockJsPDF {
  constructor(public opts?: unknown) {}
  addPage = mockAddPage
  addImage = mockAddImage
  save = mockSave
  text = mockText
  setFontSize = mockSetFontSize
  setTextColor = mockSetTextColor
}

vi.mock('jspdf', () => {
  return {
    jsPDF: MockJsPDF
  }
})

// Configurar mocks del DOM para entorno Node puro (sin JSDOM)
beforeEach(() => {
  vi.clearAllMocks()

  // Mock document
  global.document = {
    createElement: vi.fn().mockImplementation((type: string) => {
      if (type === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
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
          }),
          toDataURL: vi.fn().mockReturnValue('data:image/png;base64,mock'),
        }
      }
      return {}
    })
  } as unknown as Document

  // Mock window
  global.window = {
    Image: class {
      onload: () => void = () => {}
      onerror: (err: unknown) => void = () => {}
      crossOrigin: string = ''
      src: string = ''
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
  } as unknown as Window & typeof globalThis
})

function masterCanvas(): HTMLCanvasElement {
  return vi.mocked(document.createElement).mock.results[0].value as HTMLCanvasElement
}

describe('exportImageGridPdf', () => {
  const scaler = createScaler(1) // Escala 1:1
  const mockObj: BoardObject = {
    id: 'test-obj',
    type: 'image',
    x: 0,
    y: 0,
    w: 75.59, // 75.59 px / 37.795 px/cm = 2.0 cm exactos
    h: 75.59, // 2.0 cm exactos
    src: 'https://example.com/image.png',
  }

  it('calcula la cuadrícula sin errores de redondeo utilizando DPI 254 (100 px/cm)', async () => {
    await exportImageGridPdf(mockObj, scaler, 'Prueba', {
      gridCm: 2, // Cuadrícula de 2 cm
      sheet: { id: 'letter', labelKey: 'sheetLetter', wCm: 21.59, hCm: 27.94 }
    })

    // El canvas maestro debería medir exactamente 200px por 200px (2 cm * 100 px/cm)
    // El primer canvas creado es el master
    const master = masterCanvas()
    expect(master.width).toBe(200)
    expect(master.height).toBe(200)

    // doc.addImage debe registrar el tamaño exacto en centímetros (sw / 100 = 200 / 100 = 2 cm)
    expect(mockAddImage).toHaveBeenCalledWith(
      expect.stringContaining('data:image/png;base64'),
      'PNG',
      1, // margen por defecto (1 cm)
      1, // margen por defecto (1 cm)
      2, // ancho exacto del PDF (2 cm)
      2, // alto exacto del PDF (2 cm)
      undefined,
      'FAST'
    )
  })

  it('pasa explícitamente el tamaño de página y orientación correctos a doc.addPage()', async () => {
    // Objeto grande de 6 cm x 6 cm en una página pequeña de 3 cm x 3 cm (con margen de 0.5 cm, área imprimible = 2 cm x 2 cm)
    const largeObj: BoardObject = {
      id: 'large-obj',
      type: 'image',
      x: 0,
      y: 0,
      w: 226.77, // 6.0 cm
      h: 226.77, // 6.0 cm
      src: 'https://example.com/large.png',
    }

    await exportImageGridPdf(largeObj, scaler, 'Páginas', {
      gridCm: 2,
      marginCm: 0.5,
      landscape: true,
      sheet: { id: 'custom-small', labelKey: 'sheetLetter', wCm: 3, hCm: 4 } // en vertical: 3x4. Con landscape=true: pageW=4, pageH=3
    })

    // Con pageW=4, pageH=3, la orientación es 'landscape'.
    // Comprobar que addPage se llamó pasando el tamaño de página [4, 3] y 'landscape'
    expect(mockAddPage).toHaveBeenCalledWith([4, 3], 'landscape')
  })

  // Objeto de 6x6 cm: con cuadro de 2 cm da 3x3 celdas → 2 líneas interiores por eje.
  const sixCm: BoardObject = { id: 'six', type: 'image', x: 0, y: 0, w: 226.77, h: 226.77, src: 'https://example.com/six.png' }
  const sheet = { id: 'a0', labelKey: 'sheetA0', wCm: 84.1, hCm: 118.9 }
  const ctxOf = () => masterCanvas().getContext('2d')!

  it('quema la cuadrícula y los números cuando showGrid no se pasa (default)', async () => {
    await exportImageGridPdf(sixCm, scaler, 'Con', { gridCm: 2, sheet })
    const ctx = ctxOf()
    expect(ctx.stroke).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalled()
  })

  it('con showGrid: false no pinta líneas ni números, pero mantiene el troceado a escala', async () => {
    await exportImageGridPdf(sixCm, scaler, 'Sin', { gridCm: 2, sheet, showGrid: false })
    const ctx = ctxOf()
    expect(ctx.stroke).not.toHaveBeenCalled()
    expect(ctx.fillText).not.toHaveBeenCalled()
    // El maestro sigue midiendo 3 celdas × 2 cm × 100 px/cm = 600 px por lado.
    const master = masterCanvas()
    expect(master.width).toBe(600)
    expect(master.height).toBe(600)
    expect(mockSave).toHaveBeenCalledWith('Sin-referencia-a0-sin-cuadricula.pdf')
  })
})
