// Handoff de la lámina de Canon → editor de Board. Desacoplado: Canon deja la
// ruta de la imagen en sessionStorage y navega a Boards; el primer BoardEditor
// que monte la consume (la inserta con `addImage`) y limpia la llave. Así no se
// acoplan las dos features ni hace falta elegir board de antemano.

const KEY = 'canon:handoff:src'

/** Deja una lámina pendiente de insertar en el próximo board que se abra. */
export function setPendingFigure(src: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(KEY, src)
  } catch {
    /* modo privado / cuota: se ignora */
  }
}

/** Toma (y limpia) la lámina pendiente. `null` si no hay / SSR. */
export function takePendingFigure(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const src = window.sessionStorage.getItem(KEY)
    if (src) window.sessionStorage.removeItem(KEY)
    return src
  } catch {
    return null
  }
}
