'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import type { CutoutEditor } from '@frontend/features/tools/crop/useCutoutEditor'

/** Escenario con damero (transparencia): lienzo de edición o llamada a subir imagen. */
export default function CutoutStage({ editor }: { editor: CutoutEditor }) {
  const { t } = usePreferences()
  const { stageRef, displayRef, ready, toolMode, error, setModalOpen, onPointerDown, onPointerMove, onPointerUp } = editor

  return (
    <div
      ref={stageRef}
      className="flex-1 min-h-0 overflow-hidden relative"
      style={{
        backgroundImage:
          'linear-gradient(45deg, #80808022 25%, transparent 25%), linear-gradient(-45deg, #80808022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #80808022 75%), linear-gradient(-45deg, transparent 75%, #80808022 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
        backgroundColor: 'var(--color-surface-container-lowest)',
      }}
    >
      {ready ? (
        <canvas
          ref={displayRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className={`absolute inset-0 touch-none ${
            toolMode ? 'cursor-crosshair' : ''
          }`}
        />
      ) : (
        <button onClick={() => setModalOpen(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors">
          <span className="material-symbols-outlined text-5xl">auto_fix_high</span>
          <span className="font-mono text-label-sm uppercase tracking-widest">{t('crop.uploadPrompt')}</span>
        </button>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-sans text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-1.5 z-30">{error}</div>
      )}
    </div>
  )
}
