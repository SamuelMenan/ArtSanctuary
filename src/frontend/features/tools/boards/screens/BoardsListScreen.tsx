'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { peekHandoff } from '@shared/lib/tools/handoff'

type BoardMeta = {
  _id: string
  name: string
  isPrivate: boolean
  thumbnailUrl: string
  updatedAt: string
}

export default function BoardsListPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<BoardMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasHandoff, setHasHandoff] = useState(false)

  useEffect(() => {
    setHasHandoff(!!peekHandoff())
    fetch('/api/boards')
      .then((r) => (r.ok ? r.json() : { boards: [] }))
      .then((d) => setBoards(d.boards ?? []))
      .finally(() => setLoading(false))
  }, [])

  const createBoard = async () => {
    setCreating(true)
    setError(null)
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Board sin título' }),
    })
    const data = await res.json().catch(() => ({}))
    setCreating(false)
    if (res.ok) {
      router.push(`/dashboard/boards/${data.board._id}${hasHandoff ? '?handoff=1' : ''}`)
    } else {
      setError(data?.error?.message ?? 'No se pudo crear el board')
    }
  }

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Borrar este board? No se puede deshacer.')) return
    const res = await fetch(`/api/boards/${id}`, { method: 'DELETE' })
    if (res.ok) setBoards((b) => b.filter((x) => x._id !== id))
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <AppShell>
      <ToolActiveLayout>
       <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="pt-8 pb-12 px-[var(--spacing-grid-gutter)] w-full max-w-[1400px] mx-auto z-10 relative">
        <header className="mb-12 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display-lg text-display-lg text-[var(--color-primary)] font-bold mb-4 tracking-[-0.02em] leading-[1.1] uppercase">
              BOARDS
            </h1>
            <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase">
              Tus lienzos infinitos. Imágenes, texto y figuras guardados por cuenta.
            </p>
          </div>
          <button
            onClick={createBoard}
            disabled={creating}
            className="flex items-center gap-2 h-11 px-5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-label-sm font-semibold uppercase tracking-widest shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              {creating ? 'hourglass_top' : 'add'}
            </span>
            Nuevo board
          </button>
        </header>

        {hasHandoff && (
          <div className="mb-8 p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)] rounded-[var(--radius-lg)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[var(--color-primary)] text-2xl">file_download</span>
              <div>
                <h3 className="font-sans font-bold text-[var(--color-primary)]">Imagen lista para colocar</h3>
                <p className="font-mono text-xs text-[var(--color-on-surface-variant)] uppercase tracking-widest mt-1">
                  Selecciona un board existente o crea uno nuevo para pegar la imagen.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="mb-6 font-sans text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center p-16">
            <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-3xl">refresh</span>
          </div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface-variant)]/50">dashboard</span>
            <p className="font-sans text-[var(--color-on-surface-variant)]">Aún no tienes boards.</p>
            <button
              onClick={createBoard}
              disabled={creating}
              className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] hover:underline"
            >
              Crear el primero
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--spacing-grid-gutter)]">
            {boards.map((b) => (
              <Link href={`/dashboard/boards/${b._id}${hasHandoff ? '?handoff=1' : ''}`} key={b._id} className="block group">
                <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] overflow-hidden transition-all duration-300 group-hover:border-[var(--color-outline)] group-hover:-translate-y-1">
                  <div className="aspect-video bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] flex items-center justify-center overflow-hidden">
                    {b.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-[var(--color-on-surface-variant)]/40">dashboard</span>
                    )}
                  </div>
                  <div className="p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-sans text-[var(--color-primary)] font-semibold truncate">{b.name}</h2>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-0.5">
                        {b.isPrivate && '🔒 '}{fmtDate(b.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteBoard(b._id, e)}
                      className="shrink-0 size-9 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Borrar board"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
       </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
