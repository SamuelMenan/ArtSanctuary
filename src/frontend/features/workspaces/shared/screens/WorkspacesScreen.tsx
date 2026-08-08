'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import Spinner from '@frontend/shared/ui/Spinner'
import {
  type WorkspaceProjectMeta,
  type WorkspaceUiPlugin,
} from '../workspacePlugin'
import {
  allWorkspaceUi,
  getWorkspaceUi,
} from '../workspaceRegistry'

export default function WorkspacesScreen() {
  const { t } = usePreferences()
  const router = useRouter()
  const plugins = allWorkspaceUi()

  const [projects, setProjects] = useState<WorkspaceProjectMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // picking = selector abierto · variantPlugin = elegir sub-opción de ese tipo
  const [picking, setPicking] = useState(false)
  const [variantPlugin, setVariantPlugin] = useState<WorkspaceUiPlugin | null>(null)

  useEffect(() => {
    let ignore = false
    window.fetch('/api/carnaval-projects')
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d) => { if (!ignore) setProjects(d.projects ?? []) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [])

  const closePicker = () => { setPicking(false); setVariantPlugin(null) }

  const create = async (plugin: WorkspaceUiPlugin, variantId: string | null) => {
    if (!plugin.createProject) return
    closePicker()
    setCreating(true)
    setError(null)
    try {
      const id = await plugin.createProject(variantId)
      router.push(`/dashboard/workspaces/${id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setError(msg || t('carnaval.createError'))
    } finally {
      setCreating(false)
    }
  }

  const onSelectType = (plugin: WorkspaceUiPlugin) => {
    if (!plugin.enabled) return
    if (plugin.variants) setVariantPlugin(plugin)
    else create(plugin, null)
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="pt-8 pb-12 px-[var(--spacing-grid-gutter)] w-full max-w-[1400px] mx-auto z-10 relative">
            <header className="mb-12 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display-lg text-display-lg text-[var(--color-primary)] font-bold mb-4 tracking-[-0.02em] leading-[1.1] uppercase">
                  {t('workspaces.title')}
                </h1>
                <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase">
                  {t('workspaces.desc')}
                </p>
              </div>
              <button
                onClick={() => setPicking(true)}
                disabled={creating}
                className="flex items-center gap-2 h-11 px-5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-on-primary)] border border-[var(--color-outline)] font-mono text-label-sm font-semibold uppercase tracking-widest shrink-0 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">{creating ? 'hourglass_top' : 'add'}</span>
                {t('workspaces.newWorkspace')}
              </button>
            </header>

            {error && (
              <p className="mb-6 font-sans text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-4 py-2">
                {error}
              </p>
            )}

            {loading ? (
              <div className="flex justify-center p-16">
                <Spinner className="size-8 text-[var(--color-primary)]" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <span className="material-symbols-outlined text-6xl text-[var(--color-on-surface-variant)]/50">folder_special</span>
                <p className="font-sans text-[var(--color-on-surface-variant)]">{t('workspaces.empty')}</p>
                <button onClick={() => setPicking(true)} className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-primary)] hover:underline">
                  {t('workspaces.createFirst')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--spacing-grid-gutter)]">
                {projects.map((p) => {
                  const card = getWorkspaceUi(p.kind)?.card(p, t)
                  return (
                    <Link href={`/dashboard/workspaces/${p._id}`} key={p._id} className="block group">
                      <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-5 transition-all duration-300 group-hover:border-[var(--color-outline)] group-hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className="material-symbols-outlined text-3xl text-[var(--color-primary)]">
                            {card?.icon ?? 'dashboard'}
                          </span>
                          {card?.statusBadgeKey && (
                            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                              {t(card.statusBadgeKey)}
                            </span>
                          )}
                        </div>
                        <h2 className="font-sans text-[var(--color-primary)] font-semibold truncate">{p.name}</h2>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-1">
                          {card?.subtitle ?? ''}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {picking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closePicker}>
            <div className="w-full max-w-2xl bg-[var(--color-surface-container)] border border-[var(--color-outline)] rounded-[var(--radius-xl)] p-6" onClick={(e) => e.stopPropagation()}>
              {!variantPlugin ? (
                <>
                  <h2 className="font-display-lg text-headline-sm text-[var(--color-primary)] font-bold uppercase tracking-[-0.01em] mb-1">
                    {t('workspaces.chooseType')}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-5">
                    {t('workspaces.chooseTypeDesc')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {plugins.map((plugin) =>
                      plugin.enabled ? (
                        <button
                          key={plugin.id}
                          onClick={() => onSelectType(plugin)}
                          className="text-left p-5 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors"
                        >
                          <span className="material-symbols-outlined text-2xl text-[var(--color-primary)]">{plugin.meta.icon}</span>
                          <h3 className="font-sans font-semibold text-[var(--color-on-surface)] mt-2">{t(plugin.meta.labelKey)}</h3>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-1">{t(plugin.meta.descKey)}</p>
                        </button>
                      ) : (
                        <div
                          key={plugin.id}
                          className="relative text-left p-5 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] opacity-60 cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-2xl text-[var(--color-on-surface-variant)]">{plugin.meta.icon}</span>
                          <h3 className="font-sans font-semibold text-[var(--color-on-surface)] mt-2">{t(plugin.meta.labelKey)}</h3>
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-1">{t(plugin.meta.descKey)}</p>
                          <span className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                            {t('workspaces.soon')}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setVariantPlugin(null)} className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] mb-3">
                    {t('workspaces.back')}
                  </button>
                  <h2 className="font-display-lg text-headline-sm text-[var(--color-primary)] font-bold uppercase tracking-[-0.01em] mb-1">
                    {t(variantPlugin.meta.labelKey)}
                  </h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-5">
                    {t('workspaces.chooseVariantDesc')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {variantPlugin.variants?.().map((v) => (
                      <button
                        key={v.id}
                        onClick={() => create(variantPlugin, v.id)}
                        className="text-left p-3 rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors"
                      >
                        <h3 className="font-sans font-semibold text-[var(--color-on-surface)]">{v.label}</h3>
                        {v.sublabel && (
                          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mt-0.5">
                            {v.sublabel}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </>
  )
}
