// Fuente única de verdad para la conversión físico↔píxel del mundo de las
// herramientas (Boards, Cuadrícula, Recorte). 96 dpi: 1 cm ≈ 37.795 px.

export const PX_PER_CM = 37.795

export const cmOf = (px: number) => px / PX_PER_CM
export const pxOf = (cm: number) => cm * PX_PER_CM
