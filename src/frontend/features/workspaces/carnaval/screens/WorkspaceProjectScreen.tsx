'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import {
  getCarnavalRule,
  planoLabel,
  type CarnavalModality,
  type CarnavalPlano,
} from '@shared/lib/workspaces/carnaval'

type PlanoMeta = {
  _id: string
  name: string
  thumbnailUrl: string
  workspace?: { view?: CarnavalPlano }
}
type ProjectFull = {
  _id: string
  name: string
  modality: CarnavalModality
  year: number
  accreditationStatus: 'draft' | 'review' | 'ready'
  boards: PlanoMeta[]
}
type VersionMeta = {
  _id: string
  label: string
  isFinal: boolean
  createdAt: string
  planos: { view: string; name: string; objectCount: number }[]
}

const STATUSES = ['draft', 'review', 'ready'] as const

export default function WorkspaceProjectScreen({ projectId }: { projectId: string }) {
  const { t } = usePreferences()
  const router = useRouter()
  const [project, setProject] = useState<ProjectFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [versions, setVersions] = useState<VersionMeta[]>([])
  const [savingVersion, setSavingVersion] = useState(false)

  const loadVersions = () =>
    window.fetch(`/api/carnaval-projects/${projectId}/versions`)
      .then((r) => (r.ok ? r.json() : { versions: [] }))
      .then((d) => setVersions(d.versions ?? []))

  useEffect(() => {
    let ignore = false
    window.fetch(`/api/carnaval-projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!ignore) setProject(d.project) })
      .catch(() => { if (!ignore) setNotFound(true) })
      .finally(() => { if (!ignore) setLoading(false) })
    loadVersions()
    return () => { ignore = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const saveVersion = async () => {
    setSavingVersion(true)
    await fetch(`/api/carnaval-projects/${projectId}/versions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    await loadVersions()
    setSavingVersion(false)
  }
  const restoreVersion = async (vid: string) => {
    if (!confirm(t('carnaval.restoreConfirm'))) return
    await fetch(`/api/carnaval-projects/${projectId}/versions/${vid}`, { method: 'POST' })
  }
  const markFinal = async (vid: string) => {
    await fetch(`/api/carnaval-projects/${projectId}/versions/${vid}`, { method: 'PATCH' })
    await loadVersions()
  }
  const removeVersion = async (vid: string) => {
    await fetch(`/api/carnaval-projects/${projectId}/versions/${vid}`, { method: 'DELETE' })
    await loadVersions()
  }

  const setStatus = async (accreditationStatus: (typeof STATUSES)[number]) => {
    setProject((p) => (p ? { ...p, accreditationStatus } : p))
    await fetch(`/api/carnaval-projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accreditationStatus }),
    })
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })

  const deleteProject = async () => {
    if (!confirm(t('carnaval.deleteConfirm'))) return
    const res = await fetch(`/api/carnaval-projects/${projectId}`, { method: 'DELETE' })
    if (res.ok) router.push('/dashboard/workspaces')
  }

  if (loading) {
    return (
      <AppShell><ToolActiveLayout>
        <div className="flex-1 flex justify-center p-16">
          <span className="material-symbols-outlined animate-spin text-[var(--color-primary)] text-3xl">refresh</span>
        </div>
      </ToolActiveLayout></AppShell>
    )
  }

  if (notFound || !project) {
    return (
      <AppShell><ToolActiveLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <span className="material-symbols-outlined text-5xl text-[var(--color-on-surface-variant)]/50">error</span>
          <p className="font-sans text-[var(--color-on-surface-variant)]">{t('carnaval.notFound')}</p>
          <Link href="/dashboard/workspaces" className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] hover:underline">
            {t('carnaval.backToProjects')}
          </Link>
        </div>
      </ToolActiveLayout></AppShell>
    )
  }

  const rule = getCarnavalRule(project.modality)

  return (
    <AppShell>
      <ToolActiveLayout>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="pt-8 pb-12 px-[var(--spacing-grid-gutter)] w-full max-w-[1400px] mx-auto">
            <Link href="/dashboard/workspaces" className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]">
              {t('carnaval.backToProjects')}
            </Link>

            <header className="mt-4 mb-10 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display-lg text-display-sm text-[var(--color-primary)] font-bold tracking-[-0.02em] leading-[1.1]">
                  {project.name}
                </h1>
                <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase mt-2">
                  {`${rule.label} · 1:${rule.scale} · ${project.year}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 h-8 rounded-full font-mono text-[10px] uppercase tracking-wide transition-colors ${
                        project.accreditationStatus === s
                          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                          : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                      }`}
                    >
                      {t(`carnaval.status_${s}`)}
                    </button>
                  ))}
                </div>
                <Link
                  href={`/dashboard/workspaces/${projectId}/expediente`}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface)] transition-colors"
                  title={t('carnaval.expediente')}
                >
                  <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">description</span>
                  {t('carnaval.expediente')}
                </Link>
                <Link
                  href={`/dashboard/workspaces/${projectId}/recursos`}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface)] transition-colors"
                  title="Biblioteca Cultural"
                >
                  <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">library_books</span>
                  Recursos
                </Link>
                <button
                  onClick={deleteProject}
                  className="size-9 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title={t('carnaval.deleteProject')}
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </header>

            <h2 className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-4">
              {t('carnaval.planos')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-[var(--spacing-grid-gutter)]">
              {project.boards.map((b) => (
                <Link href={`/dashboard/tools/boards/${b._id}`} key={b._id} className="block group">
                  <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-lg)] overflow-hidden transition-all group-hover:border-[var(--color-primary)] group-hover:-translate-y-1">
                    <div className="aspect-square bg-[var(--color-surface-container-lowest)] border-b border-[var(--color-outline-variant)] flex items-center justify-center overflow-hidden">
                      {b.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-3xl text-[var(--color-on-surface-variant)]/40">draft</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-sans text-sm text-[var(--color-on-surface)] font-medium truncate">
                        {b.workspace?.view ? planoLabel(b.workspace.view) : b.name}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Versiones (Fase 8) */}
            <div className="mt-12 flex items-center justify-between mb-4">
              <h2 className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                {t('carnaval.versions')}
              </h2>
              <button
                onClick={saveVersion}
                disabled={savingVersion}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface)] transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">{savingVersion ? 'hourglass_top' : 'save'}</span>
                {t('carnaval.saveVersion')}
              </button>
            </div>

            {versions.length === 0 ? (
              <p className="font-mono text-[11px] text-[var(--color-on-surface-variant)]">{t('carnaval.noVersions')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {versions.map((v) => (
                  <div key={v._id} className="flex items-center justify-between gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans text-sm text-[var(--color-on-surface)] font-medium truncate">{v.label}</h3>
                        {v.isFinal && (
                          <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
                            {t('carnaval.versionFinal')}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-0.5">
                        {`${fmtDate(v.createdAt)} · ${v.planos.length} ${t('carnaval.planos').toLowerCase()} · ${v.planos.reduce((s, p) => s + p.objectCount, 0)} obj`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => restoreVersion(v._id)} title={t('carnaval.restore')} className="size-9 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors">
                        <span className="material-symbols-outlined text-[19px]">restore</span>
                      </button>
                      <button onClick={() => markFinal(v._id)} title={t('carnaval.markFinal')} className="size-9 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors">
                        <span className="material-symbols-outlined text-[19px]">flag</span>
                      </button>
                      <button onClick={() => removeVersion(v._id)} title={t('carnaval.deleteVersion')} className="size-9 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:text-red-500 hover:bg-red-500/10 transition-colors">
                        <span className="material-symbols-outlined text-[19px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
