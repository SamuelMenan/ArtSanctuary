'use client'

import { ReactNode, useState, useEffect, type PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { usePathname } from 'next/navigation'
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
    if (!projectId) return
    let ignore = false
    window.fetch(`/api/carnaval-projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!ignore && d?.project) setProject(d.project) })
      .catch(() => {})
    return () => { ignore = true }
  }, [projectId])

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

  return (
    <div className={`flex-1 flex overflow-hidden -m-[var(--spacing-container-padding)] ${navbarOpen ? 'h-[calc(100vh-var(--spacing-appbar-height))]' : 'h-screen'}`}>
      {/* Left Mini-Sidebar (Tool Navigation) */}
      <motion.aside
        className={`hidden lg:flex relative bg-[var(--color-surface-container-lowest)] border-[var(--color-outline-variant)] flex-col overflow-visible z-30 shrink-0 border-r`}
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

        <motion.div
          className="w-full flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
        >
          {projectId && (
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

          <div className={`flex items-center bg-[var(--color-surface-container-high)] shrink-0 border-b border-[var(--color-outline-variant)] overflow-hidden ${isExpanded ? 'px-6 h-[42px] mt-4' : 'hidden'}`}>
            <h2 className={`${sectionTitleText} whitespace-nowrap`}>
              {toolLabels.title}
            </h2>
          </div>
          <nav className={`flex flex-col font-mono text-sm tracking-[0.05em] shrink-0 pb-6 ${isExpanded ? '' : 'gap-2 mt-2 mb-4 border-t border-[var(--color-outline-variant)] pt-4'}`}>
            {tools.map((tool) => {
              const isActive = pathname.startsWith(tool.href)
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
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
