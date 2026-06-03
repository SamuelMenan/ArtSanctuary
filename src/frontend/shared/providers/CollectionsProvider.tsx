'use client'

// Caché compartida de las colecciones del usuario. Antes cada consumidor
// (Sidebar, ImageSourceModal, SaveToCollectionModal) fetcheaba `/api/collections`
// por su cuenta y en cada montaje → la lista se cargaba muchas veces. Ahora se
// pide una vez aquí y se comparte; los mutadores llaman `refresh()` para
// mantenerla fresca.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Collection } from '@shared/lib/types'

interface CollectionsCtx {
  collections: Collection[]
  loading: boolean
  refresh: () => Promise<void>
}

const Ctx = createContext<CollectionsCtx | null>(null)

export function useCollections(): CollectionsCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCollections fuera de CollectionsProvider')
  return ctx
}

export default function CollectionsProvider({
  userId,
  children,
}: {
  userId?: string | null
  children: ReactNode
}) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await window.fetch('/api/collections')
      if (res.ok) {
        const data = await res.json()
        setCollections(data.collections ?? [])
      }
    } catch {
      // silencioso: la UI cae a lista vacía
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Una sola carga al autenticarse (no por navegación ni por montaje de modales).
  useEffect(() => { void refresh() }, [refresh])

  return <Ctx.Provider value={{ collections, loading, refresh }}>{children}</Ctx.Provider>
}
