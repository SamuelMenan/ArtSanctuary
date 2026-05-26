import { MixModel } from './colorMix'

export type Swatch = { name: string; hex: string }

export type Medium = {
  id: string
  nameEs: string
  nameEn: string
  model: MixModel
  texture: 'canvas' | 'paper-grain' | 'smooth' | 'glossy' | 'matte' | 'powder'
  palette: Swatch[]
}

const oilPalette: Swatch[] = [
  { name: 'Blanco Titanio', hex: '#F5F5F0' },
  { name: 'Negro Marfil', hex: '#2E3131' },
  { name: 'Rojo Cadmio', hex: '#E30022' },
  { name: 'Amarillo Cadmio', hex: '#FFF600' },
  { name: 'Azul Ultramar', hex: '#120A8F' },
  { name: 'Azul Cerúleo', hex: '#2A52BE' },
  { name: 'Tierra Sombra', hex: '#635147' },
  { name: 'Tierra Siena', hex: '#A0522D' },
  { name: 'Ocre Amarillo', hex: '#CCAA2B' },
  { name: 'Verde Viridian', hex: '#40826D' },
  { name: 'Carmín Alizarina', hex: '#E32636' },
  { name: 'Violeta Dioxazina', hex: '#5D3FD3' },
]

const watercolorPalette: Swatch[] = [
  { name: 'Amarillo Aureolina', hex: '#F4D03F' },
  { name: 'Rojo Quinacridona', hex: '#C71585' },
  { name: 'Azul Cobalto', hex: '#0047AB' },
  { name: 'Verde Savia', hex: '#507D2A' },
  { name: 'Sepia', hex: '#704214' },
  { name: 'Payne Gris', hex: '#536878' },
  { name: 'Tierra Verde', hex: '#6B8E23' },
  { name: 'Magenta Permanente', hex: '#FF00FF' },
]

const cmykPalette: Swatch[] = [
  { name: 'Cyan Proceso', hex: '#00AEEF' },
  { name: 'Magenta Proceso', hex: '#EC008C' },
  { name: 'Amarillo Proceso', hex: '#FFF200' },
  { name: 'Negro K', hex: '#000000' },
]

const vinylPalette: Swatch[] = [
  { name: 'Oracal Blanco', hex: '#FFFFFF' },
  { name: 'Oracal Negro', hex: '#000000' },
  { name: 'Oracal Rojo Tráfico', hex: '#C8102E' },
  { name: 'Oracal Azul Real', hex: '#003DA5' },
  { name: 'Oracal Amarillo', hex: '#FFD100' },
  { name: 'Oracal Verde Lima', hex: '#A4D65E' },
  { name: 'Oracal Naranja', hex: '#FF6900' },
  { name: 'Oracal Plata', hex: '#A8A9AD' },
]

const lacquerPalette: Swatch[] = [
  { name: 'Pantone 185 Rojo', hex: '#E4002B' },
  { name: 'Pantone 286 Azul', hex: '#0033A0' },
  { name: 'Pantone Yellow', hex: '#FEDD00' },
  { name: 'Pantone 354 Verde', hex: '#00B140' },
  { name: 'Pantone Negro', hex: '#101820' },
  { name: 'Pantone Blanco', hex: '#F4F5F0' },
  { name: 'Pantone 2685 Violeta', hex: '#330072' },
]

const acrylicPalette: Swatch[] = [
  { name: 'Blanco Titanio', hex: '#F8F8F2' },
  { name: 'Negro Mars', hex: '#1C1C1C' },
  { name: 'Rojo Naphthol', hex: '#D62828' },
  { name: 'Amarillo Cadmio Medio', hex: '#FFD500' },
  { name: 'Azul Phthalo', hex: '#000F89' },
  { name: 'Verde Phthalo', hex: '#123524' },
  { name: 'Magenta Quinacridona', hex: '#9D174D' },
  { name: 'Naranja Cadmio', hex: '#FF6F00' },
]

const gouachePalette: Swatch[] = [
  { name: 'Blanco Permanente', hex: '#FAFAF0' },
  { name: 'Negro Lámpara', hex: '#1A1A1A' },
  { name: 'Rojo Primario', hex: '#E03C31' },
  { name: 'Amarillo Primario', hex: '#FFE700' },
  { name: 'Azul Primario', hex: '#0066B3' },
  { name: 'Verde Brillante', hex: '#00A859' },
  { name: 'Violeta', hex: '#7B2D8E' },
]

const inkPalette: Swatch[] = [
  { name: 'Tinta China', hex: '#0A0A0A' },
  { name: 'Sepia Tinta', hex: '#5C4033' },
  { name: 'Rojo Carmín', hex: '#960018' },
  { name: 'Azul Prusia', hex: '#003153' },
  { name: 'Verde Esmeralda', hex: '#50C878' },
]

const pastelPalette: Swatch[] = [
  { name: 'Rosa Pastel', hex: '#FFD1DC' },
  { name: 'Azul Cielo', hex: '#87CEEB' },
  { name: 'Amarillo Crema', hex: '#FFFACD' },
  { name: 'Verde Menta', hex: '#98FF98' },
  { name: 'Lavanda', hex: '#E6E6FA' },
  { name: 'Melocotón', hex: '#FFDAB9' },
  { name: 'Gris Perla', hex: '#C0C0C0' },
]

const enamelPalette: Swatch[] = [
  { name: 'Esmalte Blanco Brillo', hex: '#F0F0E8' },
  { name: 'Esmalte Negro Brillo', hex: '#0C0C0C' },
  { name: 'Esmalte Rojo Ferrari', hex: '#FF2800' },
  { name: 'Esmalte Azul Marino', hex: '#000080' },
  { name: 'Esmalte Verde Bosque', hex: '#228B22' },
]

const airbrushPalette: Swatch[] = [
  { name: 'Transparente Rojo', hex: '#FF3333' },
  { name: 'Transparente Azul', hex: '#3366FF' },
  { name: 'Transparente Amarillo', hex: '#FFFF66' },
  { name: 'Transparente Magenta', hex: '#FF33CC' },
  { name: 'Transparente Cyan', hex: '#33CCFF' },
  { name: 'Blanco Cubriente', hex: '#FFFFFF' },
  { name: 'Negro Cubriente', hex: '#000000' },
]

export const MEDIUMS: Medium[] = [
  { id: 'oil', nameEs: 'Óleo', nameEn: 'Oil', model: 'subtractive-ryb', texture: 'canvas', palette: oilPalette },
  { id: 'acrylic', nameEs: 'Acrílico', nameEn: 'Acrylic', model: 'subtractive-ryb', texture: 'canvas', palette: acrylicPalette },
  { id: 'watercolor', nameEs: 'Acuarela', nameEn: 'Watercolor', model: 'kubelka-munk', texture: 'paper-grain', palette: watercolorPalette },
  { id: 'gouache', nameEs: 'Gouache', nameEn: 'Gouache', model: 'subtractive-ryb', texture: 'paper-grain', palette: gouachePalette },
  { id: 'ink', nameEs: 'Tinta', nameEn: 'Ink', model: 'subtractive-ryb', texture: 'smooth', palette: inkPalette },
  { id: 'cmyk', nameEs: 'Impresora (CMYK)', nameEn: 'Printer (CMYK)', model: 'cmyk', texture: 'smooth', palette: cmykPalette },
  { id: 'vinyl', nameEs: 'Vinilo', nameEn: 'Vinyl', model: 'layer-opaque', texture: 'glossy', palette: vinylPalette },
  { id: 'lacquer', nameEs: 'Laca', nameEn: 'Lacquer', model: 'subtractive-ryb', texture: 'glossy', palette: lacquerPalette },
  { id: 'enamel', nameEs: 'Esmalte', nameEn: 'Enamel', model: 'subtractive-ryb', texture: 'glossy', palette: enamelPalette },
  { id: 'pastel', nameEs: 'Pastel', nameEn: 'Pastel', model: 'kubelka-munk', texture: 'powder', palette: pastelPalette },
  { id: 'airbrush', nameEs: 'Aerógrafo', nameEn: 'Airbrush', model: 'additive-rgb', texture: 'matte', palette: airbrushPalette },
]

export function getMedium(id: string): Medium {
  return MEDIUMS.find((m) => m.id === id) ?? MEDIUMS[0]
}
