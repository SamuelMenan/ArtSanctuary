"use client"

import Link from 'next/link'
import { motion } from 'motion/react'
import UploadButton from '@frontend/shared/ui/UploadButton'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useCollections } from '@frontend/shared/providers/CollectionsProvider'
import { useChrome } from './ChromeProvider'
import { transition } from '@frontend/shared/motion/tokens'

const navItems = [
  { key: 'nav.home', href: '/', icon: 'home' },
  { key: 'nav.gallery', href: '/gallery', icon: 'grid_view' },
  { key: 'nav.explore', href: '/explore', icon: 'explore' },
  { key: 'nav.tools', href: '/dashboard/tools', icon: 'handyman' },
  { key: 'nav.workspaces', href: '/dashboard/workspaces', icon: 'folder_special' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = usePreferences()
  const { sidebarOpen } = useChrome()
  // Lista compartida (CollectionsProvider): una sola carga, sin re-fetch por navegación.
  const { collections } = useCollections()

  return (
    <motion.nav
      className="hidden md:flex print:hidden flex-col h-full bg-[var(--color-surface-container)] fixed left-0 top-0 w-[var(--spacing-sidebar-width)] border-r border-[var(--color-outline-variant)] z-50"
      animate={{ x: sidebarOpen ? 0 : '-100%' }}
      transition={transition.base}
    >
      <div className="h-[var(--spacing-appbar-height)] border-b border-[var(--color-outline-variant)] px-6 flex flex-col justify-center shrink-0">
        <h1 className="text-xl font-display font-bold text-[var(--color-primary)] leading-none">
          ArtSanctuary
        </h1>
      </div>

      <ul className="flex flex-col gap-4 flex-grow px-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center h-[42px] gap-4 font-mono text-sm uppercase tracking-[0.05em] pl-4 transition-colors duration-200 `}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="px-6 pb-4 mt-auto">
         <p className="font-mono text-sm text-[var(--color-outline-variant)] mb-4 tracking-[0.05em] uppercase font-medium">{t('nav.profile')}</p>
         <ul className="flex flex-col gap-3 font-mono text-sm text-[var(--color-on-surface-variant)] mb-8 max-h-[20vh] overflow-y-auto custom-scrollbar">
            {collections.length > 0 ? collections.map(c => (
              <li key={c._id} className="flex items-center gap-2 hover:text-[var(--color-primary)] cursor-pointer transition-colors duration-200">
                <span className="text-xs material-symbols-outlined text-[16px]">folder_open</span>
                <Link href={`/collections/${c._id}`} className="truncate w-full block">{c.name}</Link>
              </li>
            )) : session ? (
              <li className="text-[10px] text-[var(--color-outline-variant)]">{t('sidebar.noCollections')}</li>
            ) : null}
         </ul>
        <UploadButton />
      </div>
    </motion.nav>
  )
}
