// Single source of truth for the physical↔pixel conversion shared by the
// tools (Boards, Grid, Crop). 96 dpi: 1 cm ≈ 37.795 px.

export const PX_PER_CM = 37.795

export const cmOf = (px: number) => px / PX_PER_CM
export const pxOf = (cm: number) => cm * PX_PER_CM
