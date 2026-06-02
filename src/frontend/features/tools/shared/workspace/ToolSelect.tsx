'use client'

/** Select con estilo unificado (aspecto de recorte, modelo de IA, etc). */
export default function ToolSelect<T extends string>({
  value,
  options,
  title,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  title?: string
  onChange: (v: T) => void
}) {
  return (
    <select
      value={value}
      title={title}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-10 px-2 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)] font-mono text-label-sm text-[var(--color-on-surface)] outline-none cursor-pointer shrink-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
