'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTraceMeasure } from './useTraceMeasure'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { buildFigure } from '@shared/lib/canon/figure'
import { buildMeasurements } from '@shared/lib/canon/measurements'
import { CANON_LIST } from '@shared/lib/canon/canons'
import { type Unit } from '@shared/lib/canon/units'
import { AVAILABLE_CANON_IDS, figureSrc, type View } from '../lib/figureMeta'
import { DEFAULT_LAYERS, type ChartLayers } from '../lib/chartLayers'
import { setPendingFigure } from '../lib/boardHandoff'
import { exportChartPng, exportChartPdf, exportChartScalePdf } from '../lib/exportChart'
import {
  listPresets,
  savePreset,
  deletePreset,
  loadLastConfig,
  saveLastConfig,
  type CanonPreset,
} from '../lib/presets'

/** Cánones que ya tienen las 3 láminas, ordenados por nº de cabezas. */
export const AVAILABLE_CANONS = CANON_LIST.filter((c) => AVAILABLE_CANON_IDS.includes(c.id))

/** TODOS los cánones modelados (con o sin lámina) para el selector. Los que no
 *  tienen lámina se muestran marcados; al elegirlos la figura cae a heroico. */
export const CANON_OPTIONS = CANON_LIST.map((c) => ({
  id: c.id,
  headCount: c.headCount,
  available: AVAILABLE_CANON_IDS.includes(c.id),
}))

/** Estado + handlers de la herramienta Canon (saca la lógica del componente). */
export function useCanonTool() {
  const { t } = usePreferences()
  const router = useRouter()
  const [canonId, setCanonId] = useState(AVAILABLE_CANONS[0]?.id ?? 'heroic')
  const [height, setHeight] = useState(175)
  const [view, setView] = useState<View>('frontal')
  const [unit, setUnit] = useState<Unit>('cm')
  const [layers, setLayers] = useState<ChartLayers>(DEFAULT_LAYERS)
  const [exporting, setExporting] = useState<null | 'png' | 'pdf' | 'scale'>(null)
  const [ghostCanonId, setGhostCanonId] = useState<string | null>(null)
  const [presets, setPresets] = useState<CanonPreset[]>([])
  const [presetId, setPresetId] = useState('')
  const [compare, setCompare] = useState(false)
  const [bCanonId, setBCanonId] = useState(canonId)
  const [bHeight, setBHeight] = useState(height)
  const [bView, setBView] = useState<View>(view)

  const trace = useTraceMeasure()

  const figure = useMemo(() => buildFigure({ canonId, heightCm: height }), [canonId, height])
  const figureB = useMemo(() => buildFigure({ canonId: bCanonId, heightCm: bHeight }), [bCanonId, bHeight])
  const measurements = useMemo(() => buildMeasurements(figure), [figure])

  const toggleLayer = useCallback((k: keyof ChartLayers) => setLayers((p) => ({ ...p, [k]: !p[k] })), [])

  // Handoff: deja la lámina actual pendiente y abre Boards (el primer editor que
  // monte la inserta). Ver `boardHandoff.ts`.
  const handleSendToBoard = useCallback(() => {
    setPendingFigure(figureSrc(canonId, view))
    router.push('/dashboard/tools/boards')
  }, [canonId, view, router])


  // Carga inicial (cliente; localStorage no existe en SSR). En microtask para no
  // setState síncrono en el effect ni provocar mismatch de hidratación: presets +
  // restaurar la última config usada (si su canon sigue teniendo láminas).
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setPresets(listPresets())
      const last = loadLastConfig()
      if (last && AVAILABLE_CANONS.some((c) => c.id === last.canonId)) {
        setCanonId(last.canonId)
        setHeight(last.height)
        setView(last.view)
        setUnit(last.unit)
        setLayers(last.layers)
      }
    })
    return () => {
      active = false
    }
  }, [])

  // Autosave de la última config (no es setState → no rompe reglas de effect).
  useEffect(() => {
    saveLastConfig({ canonId, height, view, unit, layers })
  }, [canonId, height, view, unit, layers])

  const handleExport = useCallback(
    async (kind: 'png' | 'pdf' | 'scale') => {
      if (exporting) return
      setExporting(kind)
      try {
        if (kind === 'scale') await exportChartScalePdf({ figure, view })
        else await (kind === 'png' ? exportChartPng : exportChartPdf)({ figure, view, t, layers, unit })
      } catch (err) {
        console.error('canon export failed', err)
      } finally {
        setExporting(null)
      }
    },
    [exporting, figure, view, t, layers, unit],
  )

  const handleSavePreset = useCallback(
    (name: string) => {
      const list = savePreset(name, { canonId, height, view, unit, layers })
      setPresets(list)
      setPresetId(list[list.length - 1]?.id ?? '')
    },
    [canonId, height, view, unit, layers],
  )

  const handleLoadPreset = useCallback(
    (id: string) => {
      setPresetId(id)
      const p = presets.find((x) => x.id === id)
      if (!p) return
      setCanonId(p.canonId)
      setHeight(p.height)
      setView(p.view)
      setUnit(p.unit)
      setLayers(p.layers)
    },
    [presets],
  )

  const handleDeletePreset = useCallback((id: string) => {
    setPresets(deletePreset(id))
    setPresetId((cur) => (cur === id ? '' : cur))
  }, [])

  // Al activar comparar, el lado B parte de la config actual de A.
  const toggleCompare = useCallback(() => {
    setCompare((c) => {
      if (!c) {
        setBCanonId(canonId)
        setBHeight(height)
        setBView(view)
      }
      return !c
    })
  }, [canonId, height, view])

  return {
    canonId, setCanonId, height, setHeight, view, setView, unit, setUnit,
    layers, toggleLayer, handleSendToBoard, exporting, handleExport,
    presets, presetId, handleLoadPreset, handleSavePreset, handleDeletePreset,
    compare, toggleCompare, figureB, bView, setBView, setBCanonId, setBHeight,
    figure, measurements,
    ghostCanonId, setGhostCanonId,
    ...trace,
  }
}
