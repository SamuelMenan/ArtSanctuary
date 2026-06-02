'use client'

/** Control de rango unificado: icono + slider + valor. */
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
    <label className="flex items-center gap-1.5 shrink-0" title={title}>
      <span className="material-symbols-outlined text-[16px] text-[var(--color-on-surface-variant)]">{icon}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        className="w-20 custom-range"
      />
      <span className="font-mono text-[10px] text-[var(--color-primary)] w-7 text-right">{value}{suffix}</span>
    </label>
  )
}
