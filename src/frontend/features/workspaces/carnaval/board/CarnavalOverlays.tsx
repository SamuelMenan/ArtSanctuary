'use client'

// Overlays HTML de la extensión Carnaval sobre el lienzo: selector de vista,
// etiqueta de plano fijo, botón de figura humana, alertas reglamentarias,
// pistas de planos especiales e Inspector de Acreditación. Se renderiza vía el
// slot `Overlays` de la extensión.

import { AnimatePresence, motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { transition } from '@frontend/shared/motion/tokens'
import {
  getCarnavalRule,
  CARNAVAL_VIEWS,
  VIEW_AXES,
  isGeometricView,
  planoLabel,
} from '@shared/lib/workspaces/carnaval'
import { pxOf } from '@shared/lib/measure'
import type { BoardExtSlotProps } from '@frontend/features/tools/boards/extensions/boardExtension'
import { useCarnavalBoard } from './context'
import { humanFigureSizeCm, humanFigureSvgDataUrl } from '../lib/humanFigure'
import CarnavalAlerts from './CarnavalAlerts'
import CarnavalInspector from './CarnavalInspector'

export default function CarnavalOverlays({ workspace, objects, readOnly, addObject }: BoardExtSlotProps) {
  const { t } = usePreferences()
  const { view, setView, inspectorOpen, setInspectorOpen, planoFixed } = useCarnavalBoard()
  const rule = workspace.modality ? getCarnavalRule(workspace.modality) : null
  if (!rule) return null

  const isGeometric = isGeometricView(view)

  // Figura humana disponible si la modalidad la define y la vista es vertical=alto.
  const canAddHuman =
    !readOnly &&
    rule.humanRefCm != null &&
    isGeometricView(view) &&
    VIEW_AXES[view].height === 'alto'

  // Inyecta la figura humana reglamentaria anclada a la base (pies en y=0,
  // silueta creciendo hacia arriba), escalada a la referencia de hombros.
  const addHuman = (shouldersCm: number) => {
    const { wCm, hCm } = humanFigureSizeCm(shouldersCm)
    const w = pxOf(wCm)
    const h = pxOf(hCm)
    addObject({
      type: 'image',
      src: humanFigureSvgDataUrl(shouldersCm),
      x: -w / 2,
      y: -h,
      w,
      h,
      rotation: 0,
      name: 'Figura humana',
    })
  }

  return (
    <>
      {/* Selector de vista reglamentaria (solo en boards Carnaval sueltos;
          en planos de proyecto la vista viene fijada). */}
      {!planoFixed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] shadow">
          {CARNAVAL_VIEWS.map((v) => {
            const on = view === v
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={on}
                className={`relative px-3 h-7 rounded-full font-mono text-[10px] uppercase tracking-wide transition-colors ${
                  on ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`}
              >
                {on && (
                  <motion.span
                    layoutId="carnavalViewPill"
                    className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                    transition={transition.base}
                  />
                )}
                <span className="relative z-10">{VIEW_AXES[v].label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Etiqueta del plano fijo (proyecto) */}
      {planoFixed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 h-7 flex items-center rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] shadow font-mono text-[10px] uppercase tracking-widest text-[var(--color-primary)]">
          {planoLabel(view)}
        </div>
      )}

      {/* Insertar figura humana reglamentaria (Fase 4 — Canon) */}
      {canAddHuman && rule.humanRefCm != null && (
        <button
          onClick={() => addHuman(rule.humanRefCm as number)}
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] shadow text-[var(--color-on-surface)] hover:border-[var(--color-primary)] transition-colors"
          title={t('boards.addHuman')}
        >
          <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">accessibility_new</span>
          <span className="font-mono text-[10px] uppercase tracking-widest">{`${t('boards.addHuman')} ${rule.humanRefCm}cm`}</span>
        </button>
      )}

      {/* Alertas reglamentarias no bloqueantes (solo vistas geométricas) */}
      {isGeometricView(view) && <CarnavalAlerts rule={rule} view={view} objects={objects} />}

      {/* Plano especial: pista no bloqueante (bastidores/jugadores) */}
      {!isGeometric && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <span className="px-3 py-1 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] font-mono text-[10px] uppercase tracking-widest shadow">
            {view === 'jugadores' ? t('boards.hintJugadores') : t('boards.hintBastidores')}
          </span>
        </div>
      )}

      {/* Inspector de Acreditación (Fase 7): el disparador vive ahora en la
          sección "Workspace" del rail derecho (CarnavalWorkspaceActions); aquí
          solo se renderiza el panel lateral. Fin de la colisión con la isla. */}
      <AnimatePresence>
        {inspectorOpen && (
          <CarnavalInspector
            key="carnaval-inspector"
            rule={rule}
            view={view}
            objects={objects}
            onClose={() => setInspectorOpen(false)}
            onSelectView={setView}
          />
        )}
      </AnimatePresence>
    </>
  )
}
