'use client'

import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ChromeProvider, { useChrome } from './ChromeProvider'
import { ReactNode } from 'react'

function AppShellInner({ children }: { children: ReactNode }) {
  const { sidebarOpen } = useChrome()
  return (
    <div className="min-h-screen bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main
        className={`flex-1 md:pt-16 flex flex-col min-w-0 bg-[var(--color-background)] transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-[var(--spacing-sidebar-width)]' : 'md:ml-0'
        }`}
      >
        <div className="flex-1 p-[var(--spacing-container-padding)] relative">
          {children}
        </div>
      </main>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <ChromeProvider>
      <AppShellInner>{children}</AppShellInner>
    </ChromeProvider>
  )
}
