import { AnimatePresence, motion } from 'motion/react'
import type { BoardObject } from '@shared/lib/boards/types'
import { type CarnavalRule, type CarnavalView, validateBoceto } from '@shared/lib/workspaces/carnaval'
import { fadeSlide } from '@frontend/shared/motion/tokens'
import { objectsBBoxCm, bboxToMeasures } from '../lib/carnavalInspect'

/**
 * Alertas contextuales NO bloqueantes (Fase 6). Mide la envolvente del diseño
 * frente a la modalidad/vista y muestra advertencias/incumplimientos sin
 * impedir dibujar. Banner flotante superior, sin captura de puntero.
 */
export default function CarnavalAlerts({
  rule,
  view,
  objects,
}: {
  rule: CarnavalRule
  view: CarnavalView
  objects: BoardObject[]
}) {
  const bbox = objectsBBoxCm(objects)
  if (!bbox) return null

  const report = validateBoceto(rule, bboxToMeasures(view, bbox))
  const problems = report.results.filter(
    (r) => r.status === 'over' || r.status === 'under' || r.status === 'mismatch',
  )
  const warns = report.results.filter((r) => r.status === 'warn')

  const clean = problems.length === 0 && warns.length === 0

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5 max-w-[90%]">
      <AnimatePresence mode="popLayout">
        {clean ? (
          <motion.span
            key="ok"
            layout
            variants={fadeSlide}
            initial="initial"
            animate="animate"
            exit="exit"
            className="px-3 py-1 rounded-full bg-green-600/90 text-white font-mono text-[10px] uppercase tracking-widest shadow"
          >
            ✓ {rule.label} · {report.compliancePct}% reglamento
          </motion.span>
        ) : (
          <>
            {problems.map((r) => (
              <motion.span
                key={`p-${r.axis}`}
                layout
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                className="px-3 py-1 rounded-md bg-red-600/90 text-white font-mono text-[10px] uppercase tracking-wide shadow whitespace-nowrap"
              >
                ⚠ {r.message}
              </motion.span>
            ))}
            {warns.map((r) => (
              <motion.span
                key={`w-${r.axis}`}
                layout
                variants={fadeSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                className="px-3 py-1 rounded-md bg-amber-500/90 text-white font-mono text-[10px] uppercase tracking-wide shadow whitespace-nowrap"
              >
                ⚠ {r.message}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
