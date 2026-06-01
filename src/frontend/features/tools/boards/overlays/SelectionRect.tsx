/** Recuadro de selección (rubber band) en coordenadas de pantalla. */
export default function SelectionRect({ rect }: { rect: { x: number; y: number; w: number; h: number } }) {
  if (rect.w <= 0 && rect.h <= 0) return null
  return (
    <div
      className="absolute border border-[var(--color-primary)] bg-[var(--color-primary)]/10 pointer-events-none z-10"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    />
  )
}
