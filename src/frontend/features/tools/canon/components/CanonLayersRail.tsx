'use client'

import { motion } from 'motion/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { staggerParent } from '@frontend/shared/motion/tokens'
import RailButton from './RailButton'
import { EXTRA_LAYER_KEYS, type ChartLayers } from '../lib/chartLayers'

const LAYER_KEYS = ['canon', 'anatomy', 'widths', 'loomis', 'zones', ...EXTRA_LAYER_KEYS] as const

/** Icono por capa (material-symbols). Algunos generan warning de nombre (aceptado). */
const ICON: Record<(typeof LAYER_KEYS)[number], string> = {
  canon: 'density_medium',
  anatomy: 'point_scan',
  widths: 'width_normal',
  loomis: 'architecture',
  zones: 'horizontal_distribute',
  skeleton: 'skeleton',
  muscles: 'exercise',
  joints: 'join_inner',
}

/**
 * Rail vertical flotante (derecha del lienzo, centrado) con los toggles de CAPAS. Mismo
 * lenguaje que los controles de zoom: botones-icono que cambian de aspecto según
 * estén activos (relleno primario) o no (contorno). Sustituye a las capas de la
 * barra superior.
 */
export default function CanonLayersRail({
  layers,
  onToggleLayer,
}: {
  layers: ChartLayers
  onToggleLayer: (k: keyof ChartLayers) => void
}) {
  const { t } = usePreferences()
  return (
    <motion.div variants={staggerParent} initial="initial" animate="animate" className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1.5">
      {LAYER_KEYS.map((k) => (
        <RailButton key={k} icon={ICON[k]} title={t(`canon.${k}`)} active={layers[k]} onClick={() => onToggleLayer(k)} />
      ))}
    </motion.div>
  )
}
