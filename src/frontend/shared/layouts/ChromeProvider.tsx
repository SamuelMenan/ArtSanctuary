'use client'

import { createContext, use, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

type ChromeCtx = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  // TopAppBar global (ArtSanctuary). Se esconde/muestra como el sidebar,
  // de forma independiente, para dejar solo la barra de funciones del tool.
  navbarOpen: boolean
  toggleNavbar: () => void
  setNavbarOpen: (v: boolean) => void
}

const Ctx = createContext<ChromeCtx | null>(null)

export function useChrome() {
  const c = use(Ctx)
  if (!c) throw new Error('useChrome debe usarse dentro de <ChromeProvider>')
  return c
}

export default function ChromeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? ''
  const isTools = pathname.startsWith('/dashboard/tools')
  // Boards (lista + editor) usan el layout de herramientas (tool-sidebar).
  const isBoards = pathname.startsWith('/dashboard/tools/boards')
  // Inmersiva = la página aporta su propia barra superior y ocupa todo el alto.
  const isImmersive = isTools || isBoards

  // En inmersivas el sidebar principal arranca oculto (solo la herramienta).
  const [sidebarOpen, setSidebarOpen] = useState(!isImmersive)
  // El navbar arranca visible; el usuario lo esconde/muestra a voluntad.
  const [navbarOpen, setNavbarOpen] = useState(true)

  // Auto-colapsa el sidebar al entrar a una inmersiva y restaura al salir.
  useEffect(() => {
    setSidebarOpen(!isImmersive)
  }, [isImmersive])

  return (
    <Ctx.Provider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((o) => !o),
        setSidebarOpen,
        navbarOpen,
        toggleNavbar: () => setNavbarOpen((o) => !o),
        setNavbarOpen,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
