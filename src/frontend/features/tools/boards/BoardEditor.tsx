'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
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
import ContextMenu, { type ContextMenuItem } from './components/ContextMenu'
import ShortcutsHelp from './components/ShortcutsHelp'
import DimensionsFooter from './toolbars/DimensionsFooter'
import TopBar from './toolbars/TopBar'
import ToolIsland from './toolbars/ToolIsland'
import RightRail from './toolbars/RightRail'
import ZoomIsland from './toolbars/ZoomIsland'
import { useHistory } from './hooks/useHistory'
import { useClipboard } from './hooks/useClipboard'
import { useShortcuts } from './hooks/useShortcuts'
import { usePanZoom, clampScale } from './hooks/usePanZoom'
import { useBoardData } from './hooks/useBoardData'
import { useStagePointer } from './hooks/useStagePointer'
import { useObjectCreation } from './hooks/useObjectCreation'
import { useObjectActions } from './hooks/useObjectActions'
import { useTransformerSync } from './hooks/useTransformerSync'
import { useSpacePan } from './hooks/useSpacePan'
import { useTextEditing } from './hooks/useTextEditing'
import { useBoardExport } from './hooks/useBoardExport'
import { getBoardExtension } from './extensions/registry'
import { BoardExtProvider, BoardExtOverlays, BoardExtWorkspaceActions } from './extensions/Host'
import type { BoardExtSlotProps } from './extensions/boardExtension'
import { BoardObject, BoardBackground, BoardWorkspace, DEFAULT_WORKSPACE } from '@shared/lib/boards/types'
import { workspaceScaler } from '@shared/lib/workspaces/registry'
import { fadeSlide } from '@frontend/shared/motion/tokens'

const SHAPE_TYPES = ['rect', 'ellipse', 'line', 'arrow'] as const
const isShape = (t: string) => (SHAPE_TYPES as readonly string[]).includes(t)

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from '@frontend/shared/layouts/ChromeProvider'
import { exportImageGridPdf } from './lib/imageGridPdf'

export default function BoardEditor({ boardId, workspaceId }: { boardId: string; workspaceId?: string }) {
  const { t } = usePreferences()
  // El revelado por proximidad lo gestiona ToolActiveLayout (sección); aquí solo
  // leemos `edgeReveal` para reubicar las islas pegadas al borde izquierdo.
  const { toolNavOpen, edgeReveal, isBoards } = useChrome()
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
  const [workspace, setWorkspace] = useState<BoardWorkspace>(DEFAULT_WORKSPACE)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [snap, setSnap] = useState(true)
  const [layersOpen, setLayersOpen] = useState(false)
  const dragLayer = useRef<string | null>(null)
  const [tool, setTool] = useState<'select' | 'hand' | 'measure'>('select')
  const [spaceHeld, setSpaceHeld] = useState(false)
  // Proyecto Carnaval dueño del board (define la ruta de salida). null = board libre.
  const [projectId, setProjectId] = useState<string | null>(null)
  // Paneo por arrastre (botón central) en curso: feedback de cursor "grabbing".
  const [dragPanning, setDragPanning] = useState(false)
  // Overlay de ayuda de atajos (tecla ?).
  const [helpOpen, setHelpOpen] = useState(false)
  // Menú contextual (clic derecho) en coordenadas de pantalla del contenedor.
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
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
    const next = clampScale(Math.min(sx, sy))
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
    setObjects, setBackground, setName, setPos, setScale, setFitTarget, setWorkspace, setProjectId,
  })

  // Ruta de salida: al workspace si es un plano de proyecto Carnaval; si no, lista de tableros.
  // Volver: si el board vive en un workspace (prop de la ruta o `projectId` del
  // documento), regresa al proyecto; si no, a la lista de tableros.
  const ws = workspaceId ?? projectId
  const backHref = ws ? `/dashboard/workspaces/${ws}` : '/dashboard/tools/boards'

  /* ── Extensión de lienzo del workspace (Carnaval u otro tipo) ── */
  const extension = getBoardExtension(workspace.kind)
  const scaler = useMemo(() => workspaceScaler(workspace), [workspace])

  /* ── Transformer sigue a la selección · espacio = paneo ── */
  useTransformerSync(trRef, stageRef, selectedIds, editingId, objects)
  useSpacePan(setSpaceHeld)

  /* ── Mutación con historial (undo/redo) ── */
  const { mutate, undo, redo } = useHistory(objects, setObjects, setSelectedIds, setEditingId)

  /* ── Mutadores de objetos y selección (snap, z-order, capas, escala) ── */
  const {
    snapVal, snapDrag, gridGap, setSquareCm, updateObject, selectObject, nudgeSelected, deleteSelected,
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
      onZoomIn: () => zoomBy(1.2),
      onZoomOut: () => zoomBy(1 / 1.2),
      onZoomReset: () => resetView(),
      onZoomToFit: () => zoomToFit(),
      onZoomToSelection: () => zoomToSelection(),
      onNudge: (dx, dy) => nudgeSelected(dx, dy),
      onHelp: () => setHelpOpen((v) => !v),
    },
    [selectedIds, readOnly, objects, snap, background, scale, pos, stageSize],
  )

  /* ── Creación de objetos (centro de la vista) ── */
  const { addImage, addText, addSticky, addShape, addExtensionObject } = useObjectCreation(
    objects, stageSize, pos, scale, mutate, setSelectedIds, setEditingId,
  )

  /* ── Estado del board que se pasa a la extensión del workspace ── */
  const extSlot: BoardExtSlotProps = {
    workspace, objects, readOnly, scale, pos, stageSize, squareCm: background.squareCm, addObject: addExtensionObject,
  }

  // Líneas-imán extra de la extensión (px de mundo): bordes de la guía
  // reglamentaria de Carnaval, para que el redimensionado se pegue a ellos.
  const extSnapLines = extension?.snapLines?.(extSlot) ?? { x: [], y: [] }

  // cm/cuadro que impone el workspace (Carnaval lo deriva de las medidas para que
  // las referencias calcen en el fondo). Se aplica al background al cargar/cambiar.
  const extGridSquareCm = extension?.gridSquareCm?.(extSlot) ?? 0
  useEffect(() => {
    if (extGridSquareCm > 0 && Math.abs(extGridSquareCm - background.squareCm) > 1e-6) {
      setBackground((b) => ({ ...b, squareCm: extGridSquareCm }))
    }
  }, [extGridSquareCm, background.squareCm])

  // El workspace puede dibujar su propio grid (híbrido de Carnaval) → el motor no
  // pinta el grid uniforme.
  const suppressBaseGrid = extension?.suppressBaseGrid?.(extSlot) ?? false

  // Selección simple (los paneles de formato solo aplican a un objeto).
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null

  /* ── Salidas del board: exportar PNG + enviar a otra herramienta ── */
  const { editIn, downloadBoard } = useBoardExport({
    boardId, workspaceId: ws ?? undefined, name, objects, selectedId, selectedIds,
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

  /* ── Encuadre (zoom-to-fit / a la selección, estilo Figma). Reutiliza el
     efecto de `fitTarget` que aplica pos/scale con margen. ── */
  const fitToIds = (ids: string[]) => {
    const list = objects.filter((o) => ids.includes(o.id))
    if (list.length === 0) return
    const stage = stageRef.current
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const o of list) {
      const node = stage?.findOne(`.${o.id}`)
      const r = node?.getClientRect({ relativeTo: stage ?? undefined })
      const b = r ?? { x: o.x, y: o.y, width: o.w ?? 0, height: o.h ?? 0 }
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }
    if (!Number.isFinite(minX)) return
    setFitTarget({ x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) })
  }
  const zoomToFit = () => {
    if (objects.length === 0) return resetView()
    fitToIds(objects.map((o) => o.id))
  }
  const zoomToSelection = () => {
    if (selectedIds.length === 0) return zoomToFit()
    fitToIds(selectedIds)
  }

  /* ── Punteros del escenario: regla + paneo + selección por recuadro ── */
  const { panMode, onStagePointerDown, onStagePointerMove, onStagePointerUp } = useStagePointer({
    readOnly, tool, spaceHeld, pos, objects, stageRef, toWorld,
    setMeasure, setPos, setSelectedIds, setSelRect, setDragPanning,
  })


  /* ── Líneas de grid visibles (mayor = squareCm, menor = squareCm/2) ── */
  // Color blanco (default viejo) → invisible en tema claro; cae a gris legible.
  const gridColor =
    !background.color || background.color.toLowerCase() === '#ffffff' ? '#94a3b8' : background.color

  // El grid base lo dibuja `GridLayer` auto-dirigido (lee el transform vivo del
  // Stage) → ya no se calculan líneas aquí ni se pasan por props. Solo decidimos
  // si el motor lo suprime (el workspace pinta el suyo) vía `suppressBaseGrid`.

  const sorted = useMemo(() => [...objects].sort((a, b) => a.z - b.z), [objects])

  // Las islas pegadas al borde izq se desplazan al centro cuando la flecha de
  // reapertura del mini-sidebar va a aparecer (colapsado + proximidad).
  const islandShiftLeft = isBoards && !toolNavOpen && edgeReveal.left

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)]/50">error</span>
        <p className="font-sans text-[var(--color-on-surface-variant)]">{t('boards.notFound')}</p>
        <Link href={backHref} className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] hover:underline">
          {t('boards.backToBoards')}
        </Link>
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
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
        backHref={backHref}
      />

      {/* Panel de formato de texto (texto / nota seleccionados) */}
      <AnimatePresence>
        {!readOnly && selectedObj && (selectedObj.type === 'text' || selectedObj.type === 'sticky') && (
          <TextFormatBar key="text-format" o={selectedObj} patch={patchSelected} />
        )}
      </AnimatePresence>

      {/* Panel de estilo de figuras */}
      <AnimatePresence>
        {!readOnly && selectedObj && isShape(selectedObj.type) && (
          <ShapeStyleBar key="shape-style" o={selectedObj} patch={patchSelected} />
        )}
      </AnimatePresence>

      {/* Escenario */}
      <div
        ref={containerRef}
        // Botón central: evita el auto-scroll del navegador (icono de rueda) al panear.
        onMouseDown={(e) => { if (e.button === 1) e.preventDefault() }}
        onContextMenu={(e) => {
          if (readOnly) return
          e.preventDefault()
          const r = e.currentTarget.getBoundingClientRect()
          setCtxMenu({ x: e.clientX - r.left, y: e.clientY - r.top })
        }}
        className={`flex-1 bg-[var(--color-surface-container-lowest)] min-h-0 overflow-hidden relative ${dragPanning ? 'cursor-grabbing' : panMode ? 'cursor-grab active:cursor-grabbing' : tool === 'measure' ? 'cursor-crosshair' : ''}`}
      >
        <BoardExtProvider extension={extension} slot={extSlot}>
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
          suppressBaseGrid={suppressBaseGrid}
          gridColor={gridColor}
          background={background}
          extension={extension}
          extSlot={extSlot}
          sorted={sorted}
          readOnly={readOnly}
          selectedIds={selectedIds}
          editingId={editingId}
          tool={tool}
          snap={snap}
          snapVal={snapVal}
          snapDrag={snapDrag}
          snapLines={extSnapLines}
          gridGap={gridGap}
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
            shiftRight={islandShiftLeft}
            onTool={(t) => { setTool(t); if (t !== 'measure') setMeasure(null) }}
            onAddImage={() => setModalOpen(true)}
            onAddText={addText}
            onAddSticky={addSticky}
            onAddShape={addShape}
          />
        )}

        {/* Rail derecho unificado: objeto · escala · capas · workspace.
            La sección Workspace recibe las acciones de la extensión (p. ej.
            ACREDITAR de Carnaval), que vive dentro del Provider → fin de la
            colisión con el antiguo botón flotante. */}
        <RightRail
          selectedIds={selectedIds}
          objects={objects}
          selectedObj={selectedObj}
          backgroundType={background.type}
          squareCm={background.squareCm}
          snap={snap}
          layersOpen={layersOpen}
          readOnly={readOnly}
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
          onToggleImageGrid={() => patchSelected({ gridCm: selectedObj?.gridCm ? undefined : background.squareCm })}
          onExportPdf={() => {
            if (selectedObj?.type === 'image') {
              exportImageGridPdf(selectedObj, scaler, name).catch(console.error)
            }
          }}
          workspaceSlot={extension?.WorkspaceActions ? <BoardExtWorkspaceActions extension={extension} slot={extSlot} /> : undefined}
        />

        {/* Overlays de la extensión del workspace (guías/alertas/inspector) */}
        <BoardExtOverlays extension={extension} slot={extSlot} />
        </BoardExtProvider>

        {/* Isla inferior izquierda: controles de vista */}
        <ZoomIsland scale={scale} shiftRight={islandShiftLeft} onZoomIn={() => zoomBy(1.2)} onZoomOut={() => zoomBy(1 / 1.2)} onReset={resetView} onZoomToFit={zoomToFit} />

        {/* Panel de capas (isla flotante) */}
        <AnimatePresence>
          {!readOnly && layersOpen && (
            <LayersPanel
              key="layers-panel"
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
        </AnimatePresence>

        {/* Recuadro de selección (rubber band) */}
        {selRect && <SelectionRect rect={selRect} />}

        {/* Etiqueta de distancia de la regla */}
        {measure && <MeasureLabel measure={measure} pos={pos} scale={scale} isGrid={background.type === 'grid'} scaler={scaler} />}

        {/* Cota de tamaño real del objeto seleccionado.
            Se oculta durante el paneo imperativo: como vive en coords de pantalla
            (pos/scale de React, que no se actualizan en el gesto) se quedaría
            "pegada" y saltaría al soltar. Reaparece al confirmar la posición. */}
        {selectedObj && !editingId && !dragPanning && (
          <DimensionLabel o={selectedObj} pos={pos} scale={scale} isGrid={background.type === 'grid'} scaler={scaler} />
        )}

        <AnimatePresence>
          {loaded && objects.length === 0 && !readOnly && (
            <motion.div
              key="empty-state"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none text-[var(--color-on-surface-variant)]"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
            >
              <motion.span className="material-symbols-outlined text-5xl" variants={fadeSlide}>add_photo_alternate</motion.span>
              <motion.span className="font-mono text-label-sm uppercase tracking-widest" variants={fadeSlide}>{t('boards.emptyBoardHint')}</motion.span>
              {/* Accesos directos: primer paso sin tener que ir a la barra lateral */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {[
                  { icon: 'add_photo_alternate', label: t('boards.addImageTip'), onClick: () => setModalOpen(true) },
                  { icon: 'title', label: t('boards.addTextTip'), onClick: addText },
                  { icon: 'sticky_note_2', label: t('boards.addNoteTip'), onClick: addSticky },
                ].map((chip) => (
                  <motion.button
                    key={chip.icon}
                    type="button"
                    onClick={chip.onClick}
                    variants={fadeSlide}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden>{chip.icon}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest">{chip.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edición de texto inline (textarea sobre el nodo) */}
        {editingObj && (
          <TextEditor o={editingObj} pos={pos} scale={scale} editRef={editTextRef} onChange={commitEditText} onFinish={finishEditing} />
        )}

        {/* Menú contextual (clic derecho) */}
        <AnimatePresence>
          {!readOnly && ctxMenu && (
            <ContextMenu
              key="ctx-menu"
              x={ctxMenu.x}
              y={ctxMenu.y}
              onClose={() => setCtxMenu(null)}
              items={(() => {
                const hasSel = selectedIds.length > 0
                const items: ContextMenuItem[] = [
                  { label: t('boards.ctxCopy'), icon: 'content_copy', onClick: copySelection, disabled: !hasSel },
                  { label: t('boards.ctxPaste'), icon: 'content_paste', onClick: pasteClipboard },
                  { label: t('boards.duplicateTip'), icon: 'library_add', onClick: duplicateSelection, disabled: !hasSel },
                  { label: t('boards.bringToFrontTip'), icon: 'flip_to_front', onClick: bringToFront, disabled: !hasSel },
                  { label: t('boards.sendToBackTip'), icon: 'flip_to_back', onClick: sendToBack, disabled: !hasSel },
                  { label: t('boards.deleteTip'), icon: 'delete', onClick: deleteSelected, disabled: !hasSel, danger: true },
                ]
                return items
              })()}
            />
          )}
        </AnimatePresence>

        {/* Ayuda de atajos (tecla ?) */}
        <AnimatePresence>
          {helpOpen && <ShortcutsHelp key="shortcuts-help" onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>
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
    </MotionConfig>
  )
}
