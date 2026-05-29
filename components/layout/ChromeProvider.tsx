'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

type ChromeCtx = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

const Ctx = createContext<ChromeCtx | null>(null)

export function useChrome() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useChrome debe usarse dentro de <ChromeProvider>')
  return c
}

export default function ChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isTools = pathname?.startsWith('/dashboard/tools') ?? false
  // En herramientas el sidebar principal arranca oculto (solo la herramienta).
  const [sidebarOpen, setSidebarOpen] = useState(!isTools)

  // Auto-colapsa al entrar a herramientas; restaura al salir.
  useEffect(() => {
    setSidebarOpen(!isTools)
  }, [isTools])

  return (
    <Ctx.Provider value={{ sidebarOpen, toggleSidebar: () => setSidebarOpen((o) => !o), setSidebarOpen }}>
      {children}
    </Ctx.Provider>
  )
}
