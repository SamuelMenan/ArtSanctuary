// Spinner de carga basado en CSS (anillo con borde), NO en glifo de icono. Un
// icono de fuente (refresh/hourglass/progress_activity) al rotar con `animate-spin`
// "orbita"/tiembla porque su glifo no está centrado en la caja; un borde redondo
// gira perfecto sobre su propio centro. Usa `currentColor` → hereda el color del
// texto (poné `text-...` en className).

export default function Spinner({ className = 'size-8' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    />
  )
}
