'use client'

import { useCallback, useRef, useState, type PointerEvent, type ReactNode, type WheelEvent } from 'react'
import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { staggerParent } from '@frontend/shared/motion/tokens'
import RailButton from './RailButton'

const MIN = 0.5
const MAX = 4
const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v))

/** Visor con zoom (rueda) y pan (arrastre). El pan se desactiva cuando otra
 *  herramienta necesita los clicks (p.ej. la regla). Las medidas siguen siendo
 *  correctas porque se calculan contra el rect en pantalla (ya escalado). */
export default function ZoomPanViewport({ panEnabled = true, children }: { panEnabled?: boolean; children: ReactNode }) {
  const { t } = usePreferences()
  const [scale, setScale] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 })
  const drag = useRef<null | { x: number; y: number; ox: number; oy: number }>(null)

  const onWheel = (e: WheelEvent) => {
    e.stopPropagation()
    setScale((s) => clamp(s * (e.deltaY < 0 ? 1.1 : 1 / 1.1)))
  }
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!panEnabled) return
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setOff({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) })
  }
  const endDrag = () => {
    drag.current = null
  }
  const reset = useCallback(() => {
    setScale(1)
    setOff({ x: 0, y: 0 })
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden" onWheel={onWheel}>
      <div
        className={`h-full w-full ${panEnabled ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="h-full w-full" style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${scale})`, transformOrigin: 'center center' }}>
          {children}
        </div>
      </div>
      <motion.div variants={staggerParent} initial="initial" animate="animate" className="absolute bottom-3 right-3 flex flex-col gap-1.5">
        <RailButton icon="add" title={t('canon.zoomIn')} onClick={() => setScale((s) => clamp(s * 1.2))} />
        <RailButton icon="remove" title={t('canon.zoomOut')} onClick={() => setScale((s) => clamp(s / 1.2))} />
        <RailButton icon="restart_alt" title={t('canon.zoomReset')} onClick={reset} />
      </motion.div>
    </div>
  )
}
