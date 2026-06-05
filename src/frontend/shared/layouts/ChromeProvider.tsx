'use client'

import { createContext, use, useState, useEffect, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

type EdgeReveal = { top: boolean; left: boolean }

type ChromeCtx = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
  // TopAppBar global (ArtSanctuary). Se esconde/muestra como el sidebar,
  // de forma independiente, para dejar solo la barra de funciones del tool.
  navbarOpen: boolean
  toggleNavbar: () => void
  setNavbarOpen: (v: boolean) => void
  // Mini-sidebar de herramientas (ToolActiveLayout). Vive aquí para que las islas
  // del lienzo puedan reaccionar a su colapso (revelado por proximidad en boards).
  toolNavOpen: boolean
  setToolNavOpen: (v: boolean) => void
  // Revelado por proximidad: el lienzo de boards lo activa al acercar el ratón a
  // los bordes; las flechas de reapertura y las islas lo leen.
  edgeReveal: EdgeReveal
  setEdgeReveal: (e: Partial<EdgeReveal>) => void
  /** La ruta actual es el editor/lista de boards (aplica revelado por proximidad). */
  isBoards: boolean
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
  const isBoards = pathname.startsWith('/dashboard/tools/boards') || pathname.includes('/boards')
  // Inmersiva = la página aporta su propia barra superior y ocupa todo el alto.
  const isImmersive = isTools || isBoards

  // En inmersivas el sidebar principal arranca oculto (solo la herramienta).
  const [sidebarOpen, setSidebarOpen] = useState(!isImmersive)
  // El navbar arranca visible; el usuario lo esconde/muestra a voluntad.
  const [navbarOpen, setNavbarOpen] = useState(!isBoards)
  // El mini-sidebar de tools arranca abierto.
  const [toolNavOpen, setToolNavOpen] = useState(!isBoards)
  const [edgeReveal, setEdgeRevealState] = useState<EdgeReveal>({ top: false, left: false })

  const setEdgeReveal = useCallback((e: Partial<EdgeReveal>) => {
    setEdgeRevealState((prev) => {
      const next = { ...prev, ...e }
      if (next.top === prev.top && next.left === prev.left) return prev
      return next
    })
  }, [])

  // Auto-colapsa el sidebar al entrar a una inmersiva y restaura al salir.
  // En boards, también esconde todo (navbar y tool nav) para dejar el lienzo limpio.
  useEffect(() => {
    setSidebarOpen(!isImmersive)
    if (isBoards) {
      setNavbarOpen(false)
      setToolNavOpen(false)
    } else {
      setNavbarOpen(true)
      setToolNavOpen(true)
    }
  }, [isImmersive, isBoards])

  // Limpia el revelado al salir de boards (evita estado obsoleto).
  useEffect(() => {
    if (!isBoards) setEdgeRevealState({ top: false, left: false })
  }, [isBoards])

  return (
    <Ctx.Provider
      value={{
        sidebarOpen,
        toggleSidebar: () => setSidebarOpen((o) => !o),
        setSidebarOpen,
        navbarOpen,
        toggleNavbar: () => setNavbarOpen((o) => !o),
        setNavbarOpen,
        toolNavOpen,
        setToolNavOpen,
        edgeReveal,
        setEdgeReveal,
        isBoards,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
