'use client'

import { ReactNode, useState, useEffect, useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from '@frontend/shared/layouts/ChromeProvider'
import { useCanHover } from '@frontend/shared/hooks/useCanHover'
import { transition } from '@frontend/shared/motion/tokens'
import { allWorkspaceUi } from '@frontend/features/workspaces/shared/workspacePlugin'
import { planoLabel, type CarnavalPlano } from '@shared/lib/workspaces/carnaval'

// Estilos únicos del sidebar de herramientas.
// TÍTULOS de sección (WORKSPACE, HERRAMIENTAS): MAYÚSCULAS, en una caja con color
// algo distinto al fondo del sidebar. SUBTÍTULOS (Vistas…): caja con un único
// color compartido y texto en caja normal (solo primera letra), no MAYÚSCULAS.
const sectionTitleBox =
  'flex items-center justify-between bg-[var(--color-surface-container-high)] px-6 h-[42px] shrink-0 border-b border-[var(--color-outline-variant)]'
const sectionTitleText =
  'font-mono text-sm tracking-[0.05em] uppercase text-[var(--color-on-surface)]'
const navLinkBase = 'flex items-center h-[42px] transition-colors truncate first-letter:uppercase'
const navLinkActive =
  'text-[var(--color-primary)] border-l-2 border-[var(--color-primary)] pl-[22px] bg-[var(--color-surface-container)]/50'
const navLinkIdle =
  'text-[var(--color-on-surface-variant)] pl-6 hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]'

// Distancia (px) al borde de la sección que activa el revelado por proximidad.
const EDGE_REVEAL_PX = 96

// Icono que indica más herramientas debajo (en el fade inferior del rail).
const SCROLL_MORE_ICON = 'keyboard_arrow_down'

// Entrada escalonada de los elementos del sidebar (cabeceras y enlaces) al abrir
// o navegar — evita que aparezcan "de la nada". Sirve para ambos layouts
// (herramientas y workspace), que comparten estos contenedores.
const staggerList = { hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } } }
const listItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: transition.base },
}
const MotionLink = motion.create(Link)

type PlanoMeta = {
  _id: string
  name: string
  workspace?: { view?: CarnavalPlano }
}
type ProjectMeta = {
  _id: string
  name: string
  boards: PlanoMeta[]
}

export default function ToolActiveLayout({ children, projectId }: { children: ReactNode; projectId?: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Contexto de workspace para los 2 espacios + HANDOFF. Se deduce de la URL para
  // que el layout no tenga que pasar `projectId`:
  //  1) ruta de workspace `/dashboard/workspaces/<id>/…`
  //  2) query `?ws=<id>` (tool abierta como handoff desde un workspace)
  //  3) prop `projectId` (legacy / compat)
  const wsFromPath = pathname.match(/^\/dashboard\/workspaces\/([^/]+)/)?.[1]
  const wsId = wsFromPath ?? searchParams.get('ws') ?? projectId ?? undefined

  // El rail solo tiene sentido DENTRO de una herramienta o de un workspace; no en
  // las páginas índice (lista de herramientas / lista de workspaces).
  const showRail = pathname !== '/dashboard/tools' && pathname !== '/dashboard/workspaces'
  const { locale, t } = usePreferences()
  const { navbarOpen, toolNavOpen, setToolNavOpen, edgeReveal, setEdgeReveal, isBoards } = useChrome()
  const canHover = useCanHover()
  const [reopenFocused, setReopenFocused] = useState(false)
  // Mantiene la flecha revelada mientras el ratón está sobre ella, aunque el
  // lienzo deje de reportar proximidad (evita el parpadeo/temblor al apuntarla).
  const [reopenHovered, setReopenHovered] = useState(false)
  const plugins = allWorkspaceUi()
  const [project, setProject] = useState<ProjectMeta | null>(null)
  // En boards la flecha de reapertura se oculta y solo aparece por proximidad/
  // foco/hover/táctil; en el resto de tools se muestra siempre.
  const reopenRevealed = !isBoards || edgeReveal.left || reopenFocused || reopenHovered || !canHover

  // Revelado por proximidad a nivel de sección (cubre TopBar + lienzo + flechas,
  // llega hasta el borde superior) → sin franjas muertas ni temblor.
  const onSectionPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!isBoards) return
    const r = e.currentTarget.getBoundingClientRect()
    setEdgeReveal({
      left: e.clientX - r.left < EDGE_REVEAL_PX,
      top: e.clientY - r.top < EDGE_REVEAL_PX,
    })
  }
  const onSectionPointerLeave = () => { if (isBoards) setEdgeReveal({ left: false, top: false }) }

  useEffect(() => {
    // Instancia persistente (vive en el layout): al salir del workspace hay que
    // LIMPIAR el proyecto, si no las VISTAS quedan pegadas en otras herramientas.
    if (!wsId) {
      setProject(null)
      return
    }
    let ignore = false
    window.fetch(`/api/carnaval-projects/${wsId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!ignore && d?.project) setProject(d.project) })
      .catch(() => {})
    return () => { ignore = true }
  }, [wsId])

  const toolLabels = {
    es: {
      title: 'HERRAMIENTAS',
      boards: 'Tableros',
      crop: 'Recorte',
      grid: 'Cuadrícula de referencia',
      notan: 'Notan',
      mix: 'Mezcla de colores',
      gesture: 'Dibujo gestual',
      canon: 'Canon de proporciones',
    },
    en: {
      title: 'TOOLS',
      boards: 'Boards',
      crop: 'Crop',
      grid: 'Reference grid',
      notan: 'Notan',
      mix: 'Color mixing',
      gesture: 'Gesture drawing',
      canon: 'Proportion canon',
    },
  }[locale]

  const tools = [
    { title: toolLabels.boards, href: '/dashboard/tools/boards', icon: 'dashboard' },
    { title: toolLabels.crop, href: '/dashboard/tools/crop', icon: 'crop' },
    { title: toolLabels.grid, href: '/dashboard/tools/grid', icon: 'grid_4x4' },
    { title: toolLabels.notan, href: '/dashboard/tools/notan', icon: 'contrast' },
    { title: toolLabels.mix, href: '/dashboard/tools/color-mixing', icon: 'palette' },
    { title: toolLabels.gesture, href: '/dashboard/tools/gesture', icon: 'gesture' },
    { title: toolLabels.canon, href: '/dashboard/tools/canon', icon: 'accessibility_new' },
  ]

  const [isHovered, setIsHovered] = useState(false)
  const isExpanded = toolNavOpen || isHovered

  // Scroll del rail sin scrollbar: fades superior/inferior que indican contenido
  // oculto. Se recalculan al hacer scroll, al cambiar de tamaño y al cambiar el
  // contenido (expandir/colapsar, cargar las vistas del proyecto).
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fade, setFade] = useState({ top: false, bottom: false })
  const updateFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const top = el.scrollTop > 4
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4
    setFade((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }))
  }, [])
  useEffect(() => {
    updateFades()
    window.addEventListener('resize', updateFades)
    return () => window.removeEventListener('resize', updateFades)
    // Recalcula cuando cambia el alto del contenido o el ancho del rail.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFades, isExpanded, project, plugins.length])

  return (
    <div className={`flex-1 flex overflow-hidden -m-[var(--spacing-container-padding)] ${navbarOpen ? 'h-[calc(100vh-var(--spacing-appbar-height))]' : 'h-screen'}`}>
      {/* Mini-sidebar de herramientas — solo dentro de una herramienta/workspace */}
      {showRail && (
      <motion.aside
        className={`hidden lg:flex print:hidden relative bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] flex-col overflow-visible z-30 shrink-0 border-r`}
        animate={{ width: isExpanded ? 260 : 64 }}
        transition={transition.base}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Botón flotante para abrir/cerrar el sidebar de herramientas, anclado a la derecha */}
        <button
          onClick={() => setToolNavOpen(!toolNavOpen)}
          className="absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-12 bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-r-md flex items-center justify-center hover:text-[var(--color-primary)] z-50 shadow-sm"
          aria-label={toolNavOpen ? "Ocultar barra" : "Mostrar barra"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {toolNavOpen ? 'chevron_left' : 'chevron_right'}
          </span>
        </button>

        {/* Fades indicadores de scroll (sin scrollbar). No interceptan el ratón. */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-10 z-40 bg-gradient-to-b from-[var(--color-surface-container-lowest)] to-transparent transition-opacity duration-200 ${fade.top ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 z-40 flex items-end justify-center pb-1 bg-gradient-to-t from-[var(--color-surface-container-lowest)] from-40% via-[var(--color-surface-container-lowest)]/85 to-transparent transition-opacity duration-200 ${fade.bottom ? 'opacity-100' : 'opacity-0'}`}
        >
          <motion.span
            className="material-symbols-outlined text-[22px] text-[var(--color-primary)]"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {SCROLL_MORE_ICON}
          </motion.span>
        </div>

        <motion.div
          ref={scrollRef}
          onScroll={updateFades}
          className="w-full flex flex-col h-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {wsId && (
            <>
              <div className={`flex items-center bg-[var(--color-surface-container-high)] shrink-0 border-b border-[var(--color-outline-variant)] overflow-hidden ${isExpanded ? 'px-6 h-[42px]' : 'hidden'}`}>
                <h2 className={`${sectionTitleText} whitespace-nowrap`}>
                  WORKSPACE
                </h2>
              </div>
              <nav className={`flex flex-col font-mono text-sm tracking-[0.05em] shrink-0 ${isExpanded ? '' : 'gap-2 mt-4 mb-2'}`}>
                {plugins.map((plugin) => (
                  <Link
                    key={plugin.id}
                    href="/dashboard/workspaces"
                    className={`flex items-center shrink-0 transition-colors truncate first-letter:uppercase ${isExpanded ? `h-[42px] gap-4 ${navLinkIdle}` : 'w-10 h-10 mx-auto justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]'}`}
                    title={!isExpanded ? t(plugin.meta.labelKey) : undefined}
                  >
                    <span className="material-symbols-outlined shrink-0 text-[20px]">folder_special</span>
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                      {t(plugin.meta.labelKey)}
                    </span>
                  </Link>
                ))}
              </nav>
            </>
          )}

          {project && project.boards.length > 0 && (
            <>
              <div className={`flex items-center bg-[var(--color-surface-container-high)] shrink-0 border-b border-[var(--color-outline-variant)] overflow-hidden ${isExpanded ? 'px-6 h-[42px] mt-4' : 'hidden'}`}>
                <h3 className={`${sectionTitleText} whitespace-nowrap`}>
                  VISTAS ({project.name})
                </h3>
              </div>
              <nav className={`flex flex-col font-mono text-sm tracking-[0.05em] shrink-0 ${isExpanded ? '' : 'gap-2 mt-2 mb-2 border-t border-[var(--color-outline-variant)] pt-4'}`}>
                {project.boards.map((b) => {
                  const href = `/dashboard/workspaces/${project._id}/boards/${b._id}`
                  const isActive = pathname.startsWith(href)
                  const label = b.workspace?.view ? planoLabel(b.workspace.view) : b.name
                  return (
                    <Link
                      key={b._id}
                      href={href}
                      className={`flex items-center shrink-0 transition-colors truncate first-letter:uppercase ${isExpanded ? `h-[42px] gap-4 ${isActive ? navLinkActive : navLinkIdle}` : `w-10 h-10 mx-auto justify-center rounded-lg ${isActive ? 'bg-[var(--color-surface-container-high)] text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]'}`}`}
                      title={!isExpanded ? label : undefined}
                    >
                      <span className={`material-symbols-outlined shrink-0 text-[20px] ${isActive ? 'text-[var(--color-primary)]' : ''}`}>visibility</span>
                      <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                        {label}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </>
          )}

          <div className={`flex items-center bg-[var(--color-surface-container-high)] shrink-0 border-b border-[var(--color-outline-variant)] overflow-hidden ${isExpanded ? (wsId ? 'px-6 h-[42px] mt-4' : 'px-6 h-[42px]') : 'hidden'}`}>
            <h2 className={`${sectionTitleText} whitespace-nowrap`}>
              {toolLabels.title}
            </h2>
          </div>
          <nav className={`flex flex-col font-mono text-sm tracking-[0.05em] shrink-0 pb-6 ${isExpanded ? '' : wsId ? 'gap-2 mt-2 mb-4 border-t border-[var(--color-outline-variant)] pt-4' : 'gap-2 mb-4 pt-2'}`}>
            {tools.map((tool) => {
              const slug = tool.href.split('/').pop()!
              // Dentro de un workspace: "Tableros" vuelve al PROYECTO; las demás
              // herramientas se abren scoped al workspace (`/workspaces/<id>/tools/
              // <slug>`) para conservar contexto y handoff. Fuera, ruta global.
              const isBoardsItem = tool.href === '/dashboard/tools/boards'
              const href = !wsId
                ? tool.href
                : isBoardsItem
                  ? `/dashboard/workspaces/${wsId}`
                  : `/dashboard/workspaces/${wsId}/tools/${slug}`
              // Activo SIN colisión: Tableros (→ proyecto) marca solo en el proyecto
              // o sus boards, no en las sub-rutas /tools/*; las demás, match exacto.
              const isActive = isBoardsItem
                ? wsId
                  ? pathname === href || pathname.startsWith(`${href}/boards`)
                  : pathname.startsWith('/dashboard/tools/boards')
                : pathname === href
              return (
                <Link
                  key={tool.title}
                  href={href}
                  className={`flex items-center shrink-0 transition-colors truncate first-letter:uppercase ${isExpanded ? `h-[42px] gap-4 ${isActive ? navLinkActive : navLinkIdle}` : `w-10 h-10 mx-auto justify-center rounded-lg ${isActive ? 'bg-[var(--color-surface-container-high)] text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)]'}`}`}
                  title={!isExpanded ? tool.title : undefined}
                >
                  <span className={`material-symbols-outlined shrink-0 text-[20px] ${isActive ? 'text-[var(--color-primary)]' : ''}`}>{tool.icon}</span>
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
                    {tool.title}
                  </span>
                </Link>
              )
            })}
          </nav>
        </motion.div>
      </motion.aside>
      )}

      {/* Main Tool Canvas */}
      <section
        className="flex-1 flex flex-col bg-[var(--color-background)] relative min-w-0"
        onPointerMove={onSectionPointerMove}
        onPointerLeave={onSectionPointerLeave}
      >
        {children}
      </section>
    </div>
  )
}
