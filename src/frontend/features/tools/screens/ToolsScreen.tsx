'use client'

import Link from 'next/link'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

export default function ToolsDashboardPage() {
  const { t } = usePreferences()
  const tools = [
    {
      title: t('toolsDashboard.boardsTitle'),
      desc: t('toolsDashboard.boardsDesc'),
      icon: 'dashboard',
      badge: 'FREE',
      href: '/dashboard/tools/boards'
    },
    {
      title: t('toolsDashboard.cropTitle'),
      desc: t('toolsDashboard.cropDesc'),
      icon: 'crop',
      badge: 'FREE',
      href: '/dashboard/tools/crop'
    },
    {
      title: t('toolsDashboard.cutoutTitle'),
      desc: t('toolsDashboard.cutoutDesc'),
      icon: 'background_replace',
      badge: 'FREE',
      href: '/dashboard/tools/cutout'
    },
    {
      title: t('toolsDashboard.gridTitle'),
      desc: t('toolsDashboard.gridDesc'),
      icon: 'select_all',
      badge: 'FREE',
      href: '/dashboard/tools/grid'
    },
    {
      title: t('toolsDashboard.notanTitle'),
      desc: t('toolsDashboard.notanDesc'),
      icon: 'contrast',
      badge: 'FREE',
      href: '/dashboard/tools/notan'
    },
    {
      title: t('toolsDashboard.mixTitle'),
      desc: t('toolsDashboard.mixDesc'),
      icon: 'palette',
      badge: 'FREE',
      href: '/dashboard/tools/color-mixing'
    },
    {
      title: t('toolsDashboard.gestureTitle'),
      desc: t('toolsDashboard.gestureDesc'),
      icon: 'schedule',
      badge: 'FREE',
      href: '/dashboard/tools/gesture'
    },
    {
      title: t('toolsDashboard.canonTitle'),
      desc: t('toolsDashboard.canonDesc'),
      icon: 'accessibility_new',
      badge: 'FREE',
      href: '/dashboard/tools/canon'
    }
  ]

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-[var(--spacing-grid-gutter)]">
      <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto z-10 relative">
        <header className="mb-12">
          <h1 className="font-display-lg text-display-lg text-[var(--color-primary)] font-bold mb-4 tracking-[-0.02em] leading-[1.1] uppercase">
            {t('toolsDashboard.title')}
          </h1>
          <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase">
            {t('toolsDashboard.subtitle')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--spacing-grid-gutter)]">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.href} className="block group h-full">
              <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-8 transition-all duration-300 group-hover:border-[var(--color-outline)] group-hover:-translate-y-1 group-hover:bg-[var(--color-surface-container-high)] flex flex-col h-full cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="size-16 bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-[32px] text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors">
                      {tool.icon}
                    </span>
                  </div>
                  <span className="px-3 py-1 font-mono text-[10px] tracking-widest uppercase border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] rounded-full group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                    {tool.badge}
                  </span>
                </div>
                
                <h2 className="font-sans text-headline-md text-[var(--color-primary)] font-semibold mb-3">
                  {tool.title}
                </h2>
                <p className="font-sans text-body-md text-[var(--color-on-surface-variant)] leading-[1.6]">
                  {tool.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}