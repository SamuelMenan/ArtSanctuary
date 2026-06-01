// Single source of truth for the physical↔pixel conversion shared by the
// tools (Boards, Grid, Crop). 96 dpi: 1 cm ≈ 37.795 px.

export const PX_PER_CM = 37.795

export const cmOf = (px: number) => px / PX_PER_CM
export const pxOf = (cm: number) => cm * PX_PER_CM

// SCALE_RATIO defined as an exact fraction so mappings like 28cm -> 430cm
// are exact: 430 / 28 = 215 / 14
export const SCALE_RATIO_NUM = 215
export const SCALE_RATIO_DEN = 14
export const SCALE_RATIO = SCALE_RATIO_NUM / SCALE_RATIO_DEN

export const applyScale = (cm: number) => (cm * SCALE_RATIO_NUM) / SCALE_RATIO_DEN

const trimFloat = (n: number, decimals = 2) => {
	const s = n.toFixed(decimals)
	return s.replace(/\.?0+$/, '')
}

// Format a value applying the global scale and showing cm + (m) when >= 1 m.
export const formatScaled = (cm: number) => {
	const scaled = applyScale(cm)
	const cmStr = `${trimFloat(+scaled.toFixed(2))} cm`
	if (scaled < 100) return cmStr
	const m = scaled / 100
	const mStr = trimFloat(+m.toFixed(2)) + ' m'
	return `${cmStr} (${mStr})`
}

// Helper to format a raw cm value (no scaling) consistently
export const formatCm = (cm: number) => `${trimFloat(+cm.toFixed(2))} cm`
