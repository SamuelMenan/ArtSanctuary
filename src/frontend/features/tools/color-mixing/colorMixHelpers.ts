import { hexToRgb, rgbToHex } from '@shared/lib/colorMix'

export type Slot = { hex: string; name: string; weight: number }

function clampByte(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

export function lighten(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = pct / 100
  return rgbToHex({
    r: clampByte(r + (255 - r) * f),
    g: clampByte(g + (255 - g) * f),
    b: clampByte(b + (255 - b) * f),
  })
}

export function darken(hex: string, pct: number): string {
  const { r, g, b } = hexToRgb(hex)
  const f = 1 - pct / 100
  return rgbToHex({ r: clampByte(r * f), g: clampByte(g * f), b: clampByte(b * f) })
}

export type MixLabels = {
  medium: string
  palette: string
  pigments: string
  addPigment: string
  result: string
  copy: string
  copied: string
  clear: string
  history: string
  save: string
  muddy: string
  empty: string
  proportion: string
}

export function getMixLabels(isEs: boolean): MixLabels {
  return isEs
    ? {
        medium: 'MEDIO',
        palette: 'PALETA',
        pigments: 'PIGMENTOS',
        addPigment: 'AÑADIR PIGMENTO',
        result: 'RESULTADO',
        copy: 'COPIAR',
        copied: 'COPIADO',
        clear: 'LIMPIAR',
        history: 'HISTORIAL',
        save: 'GUARDAR EN PALETA',
        muddy: 'Advertencia: mezcla fangosa, baja saturación',
        empty: 'Selecciona pigmentos de la paleta',
        proportion: 'PROPORCIÓN',
      }
    : {
        medium: 'MEDIUM',
        palette: 'PALETTE',
        pigments: 'PIGMENTS',
        addPigment: 'ADD PIGMENT',
        result: 'RESULT',
        copy: 'COPY',
        copied: 'COPIED',
        clear: 'CLEAR',
        history: 'HISTORY',
        save: 'SAVE TO PALETTE',
        muddy: 'Warning: muddy mix, low saturation',
        empty: 'Select pigments from the palette',
        proportion: 'PROPORTION',
      }
}
