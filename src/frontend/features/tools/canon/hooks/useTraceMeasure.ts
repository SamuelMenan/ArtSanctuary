'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Estado de calco (imagen de referencia) + regla interactiva del Canon.
 *  Separado de `useCanonTool` para mantener ese hook por debajo del límite de
 *  líneas y porque es una preocupación independiente. */
export function useTraceMeasure() {
  const [refUrl, setRefUrl] = useState<string | null>(null)
  const [refOpacity, setRefOpacity] = useState(0.5)
  const refUrlRef = useRef<string | null>(null)

  const [measureActive, setMeasureActive] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([])

  // Carga un archivo local como objectURL (revoca el anterior; nada se sube).
  const handleRefFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current)
    refUrlRef.current = url
    setRefUrl(url)
  }, [])
  const clearRef = useCallback(() => {
    if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current)
    refUrlRef.current = null
    setRefUrl(null)
  }, [])
  useEffect(() => () => {
    if (refUrlRef.current) URL.revokeObjectURL(refUrlRef.current)
  }, [])

  // Cada click agrega un punto; al 3.º se reinicia con ese punto.
  const addMeasurePoint = useCallback((p: { x: number; y: number }) => {
    setMeasurePoints((pts) => (pts.length >= 2 ? [p] : [...pts, p]))
  }, [])
  const clearMeasure = useCallback(() => setMeasurePoints([]), [])
  const toggleMeasure = useCallback(() => {
    setMeasureActive((a) => !a)
    setMeasurePoints([])
  }, [])

  return {
    refUrl, refOpacity, setRefOpacity, handleRefFile, clearRef,
    measureActive, toggleMeasure, measurePoints, addMeasurePoint, clearMeasure,
  }
}
