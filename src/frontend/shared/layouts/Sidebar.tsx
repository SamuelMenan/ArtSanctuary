"use client"

import Link from 'next/link'
import UploadButton from '@frontend/shared/ui/UploadButton'
import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import { useChrome } from './ChromeProvider'

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
  const [collections, setCollections] = useState<{ _id: string; name: string }[]>([])

  useEffect(() => {
    let ignore = false;
    if (session?.user?.id) {
      window.fetch('/api/collections')
        .then(res => res.json())
        .then(data => {
          if (!ignore && data.collections) setCollections(data.collections)
        })
        .catch(err => console.error(err))
    }
    return () => { ignore = true; };
  }, [session])

  return (
    <nav className={`hidden md:flex flex-col h-full py-8 gap-[var(--spacing-stack-md)] bg-[var(--color-surface-container)] fixed left-0 top-0 w-[var(--spacing-sidebar-width)] border-r border-[var(--color-outline-variant)] z-50 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-display-lg tracking-[-0.02em] text-[var(--color-primary)] font-semibold mb-1">
          ArtSanctuary
        </h1>
        <p className="font-mono text-label-sm text-[var(--color-on-surface-variant)] uppercase tracking-[0.05em] font-medium">
          {t('home.heroLabel')}
        </p>
      </div>

      <ul className="flex flex-col gap-4 flex-grow px-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`flex items-center gap-4 py-2 font-mono text-label-sm uppercase tracking-[0.05em] pl-4 transition-colors duration-200 `}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{t(item.key)}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="px-6 pb-4 mt-auto">
         <p className="font-mono text-label-sm text-[var(--color-outline-variant)] mb-4 tracking-[0.05em] uppercase font-medium">{t('nav.profile')}</p>
         <ul className="flex flex-col gap-3 font-mono text-label-sm text-[var(--color-on-surface-variant)] mb-8 max-h-[20vh] overflow-y-auto custom-scrollbar">
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
    </nav>
  )
}
