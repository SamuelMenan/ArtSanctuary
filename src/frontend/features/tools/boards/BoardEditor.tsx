'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type Konva from 'konva'
import ImageSourceModal from '@frontend/features/tools/shared/ImageSourceModal'
import BoardStage from './components/BoardStage'
import TextFormatBar from './toolbars/TextFormatBar'
import ShapeStyleBar from './toolbars/ShapeStyleBar'
import SelectionRect from './overlays/SelectionRect'
import MeasureLabel from './overlays/MeasureLabel'
import DimensionLabel from './overlays/DimensionLabel'
import TextEditor from './overlays/TextEditor'
import LayersPanel from './components/LayersPanel'
import DimensionsFooter from './toolbars/DimensionsFooter'
import TopBar from './toolbars/TopBar'
import ToolIsland from './toolbars/ToolIsland'
import InspectorIsland from './toolbars/InspectorIsland'
import ZoomIsland from './toolbars/ZoomIsland'
import { useHistory } from './hooks/useHistory'
import { useClipboard } from './hooks/useClipboard'
import { useShortcuts } from './hooks/useShortcuts'
import { usePanZoom } from './hooks/usePanZoom'
import { useBoardData } from './hooks/useBoardData'
import { useStagePointer } from './hooks/useStagePointer'
import { useObjectCreation } from './hooks/useObjectCreation'
import { useObjectActions } from './hooks/useObjectActions'
import { useTransformerSync } from './hooks/useTransformerSync'
import { useSpacePan } from './hooks/useSpacePan'
import { useTextEditing } from './hooks/useTextEditing'
import { useBoardExport } from './hooks/useBoardExport'
import { buildGridLines } from './lib/grid'
import { BoardObject, BoardBackground } from '@shared/lib/boards/types'

const SHAPE_TYPES = ['rect', 'ellipse', 'line', 'arrow'] as const
const isShape = (t: string) => (SHAPE_TYPES as readonly string[]).includes(t)

export default function BoardEditor({ boardId }: { boardId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)

  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  const [objects, setObjects] = useState<BoardObject[]>([])
  const [background, setBackground] = useState<BoardBackground>({
    type: 'grid',
    squareCm: 1.5,
    color: '#94a3b8',
    opacity: 35,
  })
  const [name, setName] = useState('Board sin título')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snap, setSnap] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const dragLayer = useRef<string | null>(null)
  const [tool, setTool] = useState<'select' | 'hand' | 'measure'>('select')
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [selRect, setSelRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  // Medición (regla): puntos A→B en coordenadas de mundo.
  const [measure, setMeasure] = useState<{ ax: number; ay: number; bx: number; by: number } | null>(null)
  const editTextRef = useRef<HTMLTextAreaElement>(null)


  const [modalOpen, setModalOpen] = useState(false)
  // Encuadre pendiente: imagen entrante por handoff a enmarcar cuando el
  // escenario ya tenga tamaño (las imágenes físicas pueden ser enormes en px).
  const [fitTarget, setFitTarget] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  /* ── Tamaño del escenario ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setStageSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  /* ── Encuadre de imagen entrante (handoff) ──
     Las imágenes físicas pueden ser enormes (p. ej. 4 m = ~15 000 px); a zoom 1
     solo se ve una esquina. Ajusta zoom/posición para enmarcar la imagen con
     margen en cuanto el escenario tenga tamaño. */
  useEffect(() => {
    if (!fitTarget || stageSize.w === 0 || stageSize.h === 0) return
    const pad = 80
    const sx = (stageSize.w - pad * 2) / fitTarget.w
    const sy = (stageSize.h - pad * 2) / fitTarget.h
    const next = Math.min(5, Math.max(0.02, Math.min(sx, sy)))
    setScale(next)
    setPos({
      x: stageSize.w / 2 - (fitTarget.x + fitTarget.w / 2) * next,
      y: stageSize.h / 2 - (fitTarget.y + fitTarget.h / 2) * next,
    })
    setFitTarget(null)
  }, [fitTarget, stageSize])

  /* ── Carga inicial + autosave ── */
  const { loaded, notFound, readOnly, saveState } = useBoardData(boardId, stageRef, trRef, {
    objects, background, name, pos, scale,
    setObjects, setBackground, setName, setPos, setScale, setFitTarget,
  })

  /* ── Transformer sigue a la selección · espacio = paneo ── */
  useTransformerSync(trRef, stageRef, selectedIds, editingId, objects)
  useSpacePan(setSpaceHeld)

  /* ── Mutación con historial (undo/redo) ── */
  const { mutate, undo, redo } = useHistory(objects, setObjects, setSelectedIds, setEditingId)

  /* ── Mutadores de objetos y selección (snap, z-order, capas, escala) ── */
  const {
    snapVal, setSquareCm, updateObject, selectObject, deleteSelected,
    toggleLock, bringToFront, sendToBack, patchSelected, patchObject,
    toggleLayerVisible, toggleLayerLock, moveLayer,
  } = useObjectActions(objects, selectedIds, setSelectedIds, background, snap, stageSize, pos, scale, mutate, setBackground)

  // pantalla → mundo
  const toWorld = (sx: number, sy: number) => ({ x: (sx - pos.x) / scale, y: (sy - pos.y) / scale })

  /* ── Copiar / pegar / duplicar ── */
  const { copySelection, pasteClipboard, duplicateSelection } = useClipboard(objects, selectedIds, setSelectedIds, mutate)

  /* ── Atajos de teclado ── */
  useShortcuts(
    {
      readOnly,
      hasSelection: selectedIds.length > 0,
      onDelete: deleteSelected,
      onUndo: undo,
      onRedo: redo,
      onCopy: copySelection,
      onPaste: pasteClipboard,
      onDuplicate: duplicateSelection,
      onSelectAll: () => setSelectedIds(objects.map((o) => o.id)),
      onHandTool: () => { setTool('hand'); setMeasure(null) },
      onSelectTool: () => { setTool('select'); setMeasure(null) },
      onMeasureTool: () => setTool('measure'),
      onEscape: () => { setMeasure(null); setSelectedIds([]) },
    },
    [selectedIds, readOnly, objects, snap, background],
  )

  /* ── Creación de objetos (centro de la vista) ── */
  const { addImage, addText, addSticky, addShape } = useObjectCreation(
    objects, stageSize, pos, scale, mutate, setSelectedIds, setEditingId,
  )

  // Selección simple (los paneles de formato solo aplican a un objeto).
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null

  /* ── Salidas del board: exportar PNG + enviar a otra herramienta ── */
  const { editIn, downloadBoard } = useBoardExport({
    boardId, name, objects, selectedId, selectedIds,
    squareCm: background.squareCm, stageRef, trRef,
  })

  const editingObj = editingId ? objects.find((o) => o.id === editingId) : null
  const selectedObj = selectedId ? objects.find((o) => o.id === selectedId) : null

  /* ── Edición de texto inline ── */
  const { commitEditText, finishEditing } = useTextEditing(
    editingId, objects, editTextRef, setObjects, setEditingId, setSelectedIds,
  )

  /* ── Pan + zoom ── */
  const { onWheel, resetView, zoomBy } = usePanZoom(scale, pos, stageSize, stageRef, setScale, setPos)

  /* ── Punteros del escenario: regla + paneo + selección por recuadro ── */
  const { panMode, onStagePointerDown, onStagePointerMove, onStagePointerUp } = useStagePointer({
    readOnly, tool, spaceHeld, pos, objects, stageRef, toWorld,
    setMeasure, setPos, setSelectedIds, setSelRect,
  })


  /* ── Líneas de grid visibles (mayor = squareCm, menor = squareCm/2) ── */
  // Color blanco (default viejo) → invisible en tema claro; cae a gris legible.
  const gridColor =
    !background.color || background.color.toLowerCase() === '#ffffff' ? '#94a3b8' : background.color

  const gridLines = useMemo(
    () =>
      buildGridLines({
        type: background.type,
        squareCm: background.squareCm,
        stageW: stageSize.w,
        stageH: stageSize.h,
        pos,
        scale,
      }),
    [background.type, background.squareCm, stageSize, pos, scale],
  )

  const sorted = useMemo(() => [...objects].sort((a, b) => a.z - b.z), [objects])

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)]/50">error</span>
        <p className="font-sans text-[var(--color-on-surface-variant)]">Board no encontrado o sin acceso.</p>
        <Link href="/dashboard/boards" className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest text-[var(--color-primary)] hover:underline">
          ← Volver a boards
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* Barra superior (mínima): documento global */}
      <TopBar
        name={name}
        onName={setName}
        readOnly={readOnly}
        saveState={saveState}
        onUndo={undo}
        onRedo={redo}
        onDownload={downloadBoard}
      />

      {/* Panel de formato de texto (texto / nota seleccionados) */}
      {!readOnly && selectedObj && (selectedObj.type === 'text' || selectedObj.type === 'sticky') && (
        <TextFormatBar o={selectedObj} patch={patchSelected} />
      )}

      {/* Panel de estilo de figuras */}
      {!readOnly && selectedObj && isShape(selectedObj.type) && (
        <ShapeStyleBar o={selectedObj} patch={patchSelected} />
      )}

      {/* Escenario */}
      <div ref={containerRef} className={`flex-1 bg-[var(--color-surface-container-lowest)] min-h-0 overflow-hidden relative ${panMode ? 'cursor-grab active:cursor-grabbing' : tool === 'measure' ? 'cursor-crosshair' : ''}`}>
        <BoardStage
          stageRef={stageRef}
          trRef={trRef}
          stageSize={stageSize}
          pos={pos}
          scale={scale}
          onWheel={onWheel}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          gridLines={gridLines}
          gridColor={gridColor}
          background={background}
          sorted={sorted}
          readOnly={readOnly}
          selectedIds={selectedIds}
          editingId={editingId}
          tool={tool}
          snap={snap}
          snapVal={snapVal}
          measure={measure}
          onSelectObject={selectObject}
          setSelectedIds={setSelectedIds}
          setEditingId={setEditingId}
          onUpdateObject={updateObject}
        />

        {/* Isla izquierda: herramientas + creación */}
        {!readOnly && (
          <ToolIsland
            tool={tool}
            onTool={(t) => { setTool(t); if (t !== 'measure') setMeasure(null) }}
            onAddImage={() => setModalOpen(true)}
            onAddText={addText}
            onAddSticky={addSticky}
            onAddShape={addShape}
          />
        )}

        {/* Isla derecha: inspector contextual + capas */}
        {!readOnly && (
          <InspectorIsland
            selectedIds={selectedIds}
            objects={objects}
            selectedObj={selectedObj}
            backgroundType={background.type}
            squareCm={background.squareCm}
            snap={snap}
            layersOpen={layersOpen}
            onToggleLock={toggleLock}
            onDuplicate={duplicateSelection}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onEditIn={editIn}
            onDelete={deleteSelected}
            onToggleBackground={() => setBackground((b) => ({ ...b, type: b.type === 'grid' ? 'plain' : 'grid' }))}
            onToggleSnap={() => setSnap((s) => !s)}
            onSetSquareCm={setSquareCm}
            onToggleLayers={() => setLayersOpen((v) => !v)}
          />
        )}

        {/* Isla inferior izquierda: controles de vista */}
        <ZoomIsland scale={scale} onZoomIn={() => zoomBy(1.2)} onZoomOut={() => zoomBy(1 / 1.2)} onReset={resetView} />

        {/* Panel de capas (isla flotante) */}
        {!readOnly && layersOpen && (
          <LayersPanel
            objects={objects}
            selectedIds={selectedIds}
            selectedObj={selectedObj}
            dragRef={dragLayer}
            onSelect={(id) => setSelectedIds([id])}
            onClose={() => setLayersOpen(false)}
            onMove={moveLayer}
            onToggleVisible={toggleLayerVisible}
            onToggleLock={toggleLayerLock}
            onPatch={patchObject}
          />
        )}

        {/* Recuadro de selección (rubber band) */}
        {selRect && <SelectionRect rect={selRect} />}

        {/* Etiqueta de distancia de la regla */}
        {measure && <MeasureLabel measure={measure} pos={pos} scale={scale} isGrid={background.type === 'grid'} />}

        {/* Cota de tamaño real del objeto seleccionado */}
        {selectedObj && !editingId && (
          <DimensionLabel o={selectedObj} pos={pos} scale={scale} isGrid={background.type === 'grid'} />
        )}

        {loaded && objects.length === 0 && !readOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
            <span className="font-mono text-[var(--text-label-sm)] uppercase tracking-widest">Añade imagen, texto o nota para empezar</span>
          </div>
        )}

        {/* Edición de texto inline (textarea sobre el nodo) */}
        {editingObj && (
          <TextEditor o={editingObj} pos={pos} scale={scale} editRef={editTextRef} onChange={commitEditText} onFinish={finishEditing} />
        )}
      </div>

      {/* Footer: escala + dimensiones exactas del objeto seleccionado */}
      <DimensionsFooter
        squareCm={background.squareCm}
        objectCount={objects.length}
        selectedCount={selectedIds.length}
        selectedObj={selectedObj}
        readOnly={readOnly}
        onPatch={patchSelected}
      />

      {modalOpen && (
        <ImageSourceModal
          onClose={() => setModalOpen(false)}
          onSelect={(url) => {
            addImage(url)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
