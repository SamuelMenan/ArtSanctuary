// Colores por grupo muscular para la CAPA "Músculos" del chart de Canon.
// Tomados del écorché de referencia `public/canon/heroic/referencia.png`
// (mapa miológico a color): cada grupo lleva el tono con el que aparece allí
// (morado=trapecio, naranja=deltoides/isquios, azul=infraespinoso/tríceps/pies,
// rojo/salmón=dorsal/glúteo, verde=erectores/gemelos/cuello). Cubre también las
// claves de frontal/lateral para que la capa pinte en cualquier vista; las
// articulaciones/manos van en tono neutro (no son masas musculares pintadas).

/** key de región (partHits) → color de relleno (hex). */
export const MUSCLE_COLORS: Record<string, string> = {
  // Tronco posterior (referencia a color)
  trapezius: '#9f7bc4', // morado
  shoulder: '#f0a850', // naranja (deltoides)
  lats: '#d76b6b', // rojo/salmón (dorsal alto)
  infraspinatus: '#7fb0e6', // azul (infraespinoso/redondos)
  lumbar: '#8fc98f', // verde (erectores)
  gluteus: '#e07b7b', // rojo (glúteo)
  // Brazos
  arm: '#6f9fd8', // azul (tríceps/bíceps)
  forearm: '#d39a6a', // naranja-tostado (extensores)
  // Piernas
  hamstring: '#f4c07a', // naranja (isquiotibiales)
  popliteal: '#8fc0e6', // azul (corva)
  calf: '#8fc98f', // verde (gemelos)
  thigh: '#c98fb8', // muslo (frontal/lateral)
  leg: '#8fc98f', // pierna (frontal/lateral)
  knee: '#cbb06a', // rodilla
  // Cuello/cabeza
  neck: '#9cc080', // verde
  head: '#cfc0a8', // neutro
  // Tronco frontal/lateral
  torso: '#d76b6b',
  chest: '#e08585',
  abdomen: '#f0b870',
  pelvis: '#c98fb8',
  flank: '#d39a6a',
  hip: '#c98fb8',
  // Articulaciones / extremos (neutros: no son masas pintadas en la referencia)
  elbow: '#cbb06a',
  wrist: '#cbb06a',
  ankle: '#cbb06a',
  hand: '#cfc0a8',
  foot: '#7fb0e6', // azul (como en la referencia)
}

// Paleta de la vista FRONTAL = colores del DIBUJO del usuario (musculos.png), que
// difieren de los del écorché posterior. Como las claves se comparten entre vistas
// (neck/shoulder/arm…), la frontal usa este override para pintar IGUAL que el dibujo
// sin alterar posterior/lateral.
// Paleta de 14 tonos TODOS distintos entre sí (cada músculo un color propio, no
// solo "un poco más claro" que el vecino): hues repartidos por la rueda + variación
// de saturación/luminosidad. Muteada a propósito (no se satura/neón). Sin `pelvis`
// (eliminada del frontal). Vecinos que antes colisionaban ya separados de verdad:
// neck↔shoulder (rosa→naranja), trapezius↔hand (violeta→magenta), flank↔thigh
// (lavanda dup → teal vs periwinkle), abdomen↔knee (verde→marrón), bicep↔foot (azul cielo→azul real).
const FRONTAL_COLORS: Record<string, string> = {
  head: '#e8d6bf', // beige cálido suave (el más claro)
  neck: '#e09bb0', // rosa suave
  trapezius: '#ac8fd0', // violeta suave
  shoulder: '#ecac79', // naranja suave (deltoides)
  chest: '#e8d27a', // amarillo oro suave (pectorales)
  bicep: '#84bce0', // azul cielo suave
  forearm: '#c0cf86', // verde-oliva suave
  hand: '#d68cc2', // magenta suave
  abdomen: '#8ccb9b', // verde hoja suave (recto)
  flank: '#79c6b6', // teal suave (oblicuo/serrato)
  thigh: '#a89fdd', // periwinkle suave (cuádriceps)
  knee: '#c89567', // marrón suave (rótula)
  leg: '#e6938a', // rojo-salmón suave (gemelo)
  foot: '#8a9bd9', // azul índigo suave (pie)
}

/** Color de una región (o un gris neutro si no está mapeada). La vista frontal usa
 *  la paleta del dibujo; el resto, los tonos del écorché posterior. */
export function muscleColor(key: string, view?: string): string {
  if (view === 'frontal' && FRONTAL_COLORS[key]) return FRONTAL_COLORS[key]
  return MUSCLE_COLORS[key] ?? '#b0a8a0'
}
