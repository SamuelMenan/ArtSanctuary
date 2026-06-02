'use client'

/** Control de rango unificado a lo ancho del panel: icono + pista + valor. */
export default function ToolSlider({
  icon,
  min,
  max,
  value,
  suffix = '',
  title,
  onChange,
  onPointerDown,
  onPointerUp,
}: {
  icon: string
  min: number
  max: number
  value: number
  suffix?: string
  title?: string
  onChange: (v: number) => void
  onPointerDown?: () => void
  onPointerUp?: () => void
}) {
  return (
    <label className="flex items-center gap-2.5 w-full" title={title}>
      <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)] shrink-0">{icon}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="flex-1 min-w-0 custom-range"
      />
      <span className="font-mono text-[10px] text-[var(--color-primary)] w-9 text-right tabular-nums shrink-0">{value}{suffix}</span>
    </label>
  )
}
