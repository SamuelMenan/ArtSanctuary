/** Etiqueta de columna estilo hoja de cálculo: 0→A, 25→Z, 26→AA… */
export function colLabel(n: number): string {
  let s = ''
  n += 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
