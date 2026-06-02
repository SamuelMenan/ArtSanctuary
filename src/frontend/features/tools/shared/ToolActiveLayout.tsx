'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from '@frontend/shared/layouts/ChromeProvider'

export default function ToolActiveLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale } = usePreferences()
  const { navbarOpen } = useChrome()
  const [navOpen, setNavOpen] = useState(true)

  const toolLabels = {
    es: {
      title: 'HERRAMIENTAS',
      boards: 'BOARDS',
      crop: 'RECORTE',
      grid: 'CUADRÍCULA DE REFERENCIA',
      notan: 'NOTAN',
      mix: 'MEZCLA DE COLORES',
      gesture: 'DIBUJO GESTUAL',
      canon: 'CANON DE PROPORCIONES',
    },
    en: {
      title: 'TOOLS',
      boards: 'BOARDS',
      crop: 'CROP',
      grid: 'REFERENCE GRID',
      notan: 'NOTAN',
      mix: 'COLOR MIXING',
      gesture: 'GESTURE DRAWING',
      canon: 'PROPORTION CANON',
    },
  }[locale]

  const tools = [
    { title: toolLabels.boards, href: '/dashboard/boards' },
    { title: toolLabels.crop, href: '/dashboard/tools/crop' },
    { title: toolLabels.grid, href: '/dashboard/tools/grid' },
    { title: toolLabels.notan, href: '/dashboard/tools/notan' },
    { title: toolLabels.mix, href: '/dashboard/tools/color-mixing' },
    { title: toolLabels.gesture, href: '/dashboard/tools/gesture' },
    { title: toolLabels.canon, href: '/dashboard/tools/canon' },
  ]

  return (
    <div className={`flex-1 flex overflow-hidden -m-[var(--spacing-container-padding)] ${navbarOpen ? 'h-[calc(100vh-64px)]' : 'h-screen'}`}>
      {/* Left Mini-Sidebar (Tool Navigation) */}
      <aside
        className={`hidden lg:flex bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)] flex-col overflow-hidden z-10 shrink-0 transition-[width] duration-300 ease-in-out ${
          navOpen ? 'w-[260px]' : 'w-0 border-r-0'
        }`}
      >
        <div className="w-[260px] flex flex-col h-full overflow-y-auto">
          <div className="pt-8 pb-4 px-6 flex items-center justify-between">
            <h2 className="font-mono text-label-sm text-[var(--color-on-surface-variant)] tracking-[0.05em] uppercase">
              {toolLabels.title}
            </h2>
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Ocultar herramientas"
              className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
          </div>
        <nav className="flex-1 flex flex-col font-mono text-label-sm tracking-[0.05em]">
          {tools.map((tool) => {
            const isActive = pathname.startsWith(tool.href)
            return (
              <Link 
                key={tool.title} 
                href={tool.href}
                className={`py-3 transition-colors ${
                  isActive 
                    ? 'text-[var(--color-primary)] border-l-2 border-[var(--color-primary)] pl-6 bg-[var(--color-surface-container)]/50' 
                    : 'text-[var(--color-on-surface-variant)] pl-[26px] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]'
                }`}
              >
                {tool.title}
              </Link>
            )
          })}
          </nav>
        </div>
      </aside>

      {/* Main Tool Canvas */}
      <section className="flex-1 flex flex-col bg-[var(--color-background)] relative min-w-0">
        {/* Botón flotante para reabrir el sidebar de herramientas */}
        {!navOpen && (
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Mostrar herramientas"
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-0 z-20 items-center justify-center w-7 h-14 rounded-r-md bg-[var(--color-surface-container)] border border-l-0 border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] shadow-md transition-all duration-200 animate-in fade-in slide-in-from-left-2"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        )}
        {children}
      </section>
    </div>
  )
}
