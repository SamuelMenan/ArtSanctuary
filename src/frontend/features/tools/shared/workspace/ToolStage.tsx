'use client'

import type { ReactNode, RefObject } from 'react'
import EmptyState from './EmptyState'

const CHECKER = {
  backgroundImage:
    'linear-gradient(45deg, #80808022 25%, transparent 25%), linear-gradient(-45deg, #80808022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #80808022 75%), linear-gradient(-45deg, transparent 75%, #80808022 75%)',
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
  backgroundColor: 'var(--color-surface-container-lowest)',
} as const

/**
 * Lienzo unificado. REQUISITO DURO: nunca scrollea (`min-h-0 overflow-hidden`).
 * `checker` muestra damero de transparencia (herramientas con alfa).
 */
export default function ToolStage({
  stageRef,
  hasImage,
  checker = false,
  emptyIcon,
  emptyPrompt,
  onPickImage,
  error,
  children,
}: {
  stageRef?: RefObject<HTMLDivElement | null>
  hasImage: boolean
  checker?: boolean
  emptyIcon?: string
  emptyPrompt?: string
  onPickImage: () => void
  error?: string | null
  children?: ReactNode
}) {
  return (
    <div
      ref={stageRef}
      className="flex-1 min-h-0 overflow-hidden relative flex items-center justify-center bg-[var(--color-surface-container-lowest)]"
      style={checker ? CHECKER : undefined}
    >
      {hasImage ? children : <EmptyState icon={emptyIcon} prompt={emptyPrompt} onClick={onPickImage} />}
      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-1.5 z-30 max-w-[90%] text-center">
          {error}
        </div>
      )}
    </div>
  )
}
