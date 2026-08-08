'use client'

import { useEffect, useState, type KeyboardEvent } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { getPartHits } from '@shared/lib/canon/partHits'
import { type View } from '../lib/figureMeta'

/**
 * Regiones clicables por parte (A3, estilo anatomy4sculptors en 2D): un `path`
 * SVG por parte SOBRE la lámina (contorno real, nunca cajas — P9). Hover
 * resalta la forma + chip de nombre; clic selecciona y un scrim atenúa el
 * resto (spotlight). El SVG usa el MISMO bbox que la figura (inset-0 +
 * viewBox 0 0 1 1 sin preservar aspecto) → calza pixel a pixel a cualquier
 * zoom. Con la regla activa la capa se desactiva para no robar clics.
 * `hoverPart` es local (no re-renderiza el chart); `activePart` viene del hook.
 */
export default function PartHitLayer({
  canonId,
  view,
  activePart,
  onSelectPart,
  disabled = false,
}: {
  canonId: string
  view: View
  activePart: string | null
  onSelectPart: (key: string | null) => void
  disabled?: boolean
}) {
  const { t } = usePreferences()
  // Id estable y URL-safe (useId genera caracteres inválidos para url(#…)).
  const maskId = `parthit-spot-${canonId}-${view}`
  const [hoverPart, setHoverPart] = useState<string | null>(null)
  const hits = getPartHits(canonId, view)
  const entries = Object.entries(hits)

  // Esc cierra la selección desde cualquier foco.
  useEffect(() => {
    if (!activePart) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onSelectPart(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePart, onSelectPart])

  if (!entries.length) return null

  const onPartKey = (e: KeyboardEvent, key: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelectPart(key)
    }
  }

  const active = activePart ? hits[activePart] : undefined
  const hot = disabled ? null : hoverPart

  return (
    <>
      <svg
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden={disabled || undefined}
        className={`absolute inset-0 h-full w-full overflow-visible ${disabled ? 'pointer-events-none' : ''}`}
      >
        {/* Spotlight: atenúa todo menos la parte activa (el path recorta el scrim).
            Clic en el scrim (zona vacía) = deseleccionar. */}
        {active && (
          <mask id={maskId}>
            <rect x="0" y="0" width="1" height="1" fill="white" />
            <path d={active.path} fill="black" />
          </mask>
        )}
        {active && (
          <rect
            x="0" y="0" width="1" height="1"
            mask={`url(#${maskId})`}
            fill="rgba(0,0,0,0.22)"
            style={{ pointerEvents: disabled ? 'none' : 'fill', cursor: 'default' }}
            onClick={() => onSelectPart(null)}
          />
        )}
        {entries.map(([key, hit]) => {
          const isActive = key === activePart
          const isHot = key === hot
          return (
            <path
              key={key}
              d={hit.path}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={t(`canon.part.names.${key}`)}
              aria-pressed={isActive}
              vectorEffect="non-scaling-stroke"
              fill={isActive || isHot ? 'var(--color-primary)' : 'transparent'}
              fillOpacity={isActive ? 0.1 : isHot ? 0.12 : 0}
              stroke={isActive || isHot ? 'var(--color-primary)' : 'transparent'}
              strokeOpacity={isActive ? 0.9 : isHot ? 0.6 : 0}
              strokeWidth={isActive ? 2 : 1.5}
              style={{
                pointerEvents: disabled ? 'none' : 'fill',
                cursor: 'pointer',
                transition: 'fill-opacity 150ms ease, stroke-opacity 150ms ease',
                outline: 'none',
              }}
              onPointerEnter={() => setHoverPart(key)}
              onPointerLeave={() => setHoverPart((cur) => (cur === key ? null : cur))}
              onFocus={() => setHoverPart(key)}
              onBlur={() => setHoverPart((cur) => (cur === key ? null : cur))}
              onClick={() => onSelectPart(key)}
              onKeyDown={(e) => onPartKey(e, key)}
            />
          )
        })}
      </svg>
      {/* Chip de nombre junto al ancla de la parte resaltada (HTML: el SVG
          va estirado y deformaría el texto). */}
      {hot && hits[hot] && (
        <span
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-sm border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-on-surface)] shadow-sm"
          style={{ left: `${hits[hot].cx * 100}%`, top: `${hits[hot].cy * 100}%` }}
        >
          {t(`canon.part.names.${hot}`)}
        </span>
      )}
    </>
  )
}
