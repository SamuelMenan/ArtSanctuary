'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePreferences } from '../AppPreferencesProvider'

export default function ToolActiveLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { locale } = usePreferences()

  const toolLabels = {
    es: {
      title: 'HERRAMIENTAS',
      paper: 'PAPEL MILIMETRADO',
      grid: 'CUADRÍCULA DE REFERENCIA',
      notan: 'NOTAN',
      mix: 'MEZCLA DE COLORES',
      gesture: 'DIBUJO GESTUAL',
      canon: 'CANON DE PROPORCIONES',
    },
    en: {
      title: 'TOOLS',
      paper: 'GRAPH PAPER',
      grid: 'REFERENCE GRID',
      notan: 'NOTAN',
      mix: 'COLOR MIXING',
      gesture: 'GESTURE DRAWING',
      canon: 'PROPORTION CANON',
    },
  }[locale]

  const tools = [
    { title: toolLabels.paper, href: '/dashboard/tools/papel-milimetrado' },
    { title: toolLabels.grid, href: '/dashboard/tools/cuadricula' },
    { title: toolLabels.notan, href: '/dashboard/tools/notan' },
    { title: toolLabels.mix, href: '/dashboard/tools/mezcla' },
    { title: toolLabels.gesture, href: '/dashboard/tools/gesture' },
    { title: toolLabels.canon, href: '/dashboard/tools/canon' },
  ]

  return (
    <div className="flex-1 flex overflow-hidden -m-[var(--spacing-container-padding)] h-[calc(100vh-64px)]">
      {/* Left Mini-Sidebar (Tool Navigation) */}
      <aside className="hidden lg:flex w-[260px] bg-[var(--color-surface-container-lowest)] border-r border-[var(--color-outline-variant)] flex-col overflow-y-auto z-10">
        <div className="pt-8 pb-4 px-6">
          <h2 className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] tracking-[0.05em] uppercase">
            {toolLabels.title}
          </h2>
        </div>
        <nav className="flex-1 flex flex-col font-mono text-[var(--text-label-sm)] tracking-[0.05em]">
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
      </aside>
      
      {/* Main Tool Canvas */}
      <section className="flex-1 flex flex-col bg-[var(--color-background)] relative min-w-0">
        {children}
      </section>
    </div>
  )
}
