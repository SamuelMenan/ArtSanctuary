'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  getCarnavalRule,
  planoLabel,
  isGeometricView,
  VIEW_AXES,
  validateBoceto,
  type CarnavalModality,
  type CarnavalPlano,
  type CarnavalAxis,
  type BocetoReport,
} from '@shared/lib/workspaces/carnaval'
import { objectsBBoxCm, bboxToMeasures } from '@frontend/features/workspaces/carnaval/lib/carnavalInspect'
import type { BoardObject } from '@shared/lib/boards/types'

type PlanoMeta = { _id: string; name: string; thumbnailUrl: string; workspace?: { view?: CarnavalPlano } }
type ProjectFull = {
  _id: string
  name: string
  modality: CarnavalModality
  year: number
  accreditationStatus: 'draft' | 'review' | 'ready'
  boards: PlanoMeta[]
}

const AXES: CarnavalAxis[] = ['alto', 'ancho', 'largo', 'espesor']
const AXIS_LABEL: Record<CarnavalAxis, string> = { alto: 'Alto', ancho: 'Ancho', largo: 'Largo', espesor: 'Espesor' }

/** Expediente técnico imprimible (Fase 9). Pensado para "Guardar como PDF". */
export default function ExpedienteScreen({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectFull | null>(null)
  const [reports, setReports] = useState<Record<string, BocetoReport>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let ignore = false
    window.fetch(`/api/carnaval-projects/${projectId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(async (d) => {
        if (ignore) return
        const proj: ProjectFull = d.project
        setProject(proj)
        const rule = getCarnavalRule(proj.modality)
        // Validación por plano geométrico: carga objetos de cada board.
        const entries = await Promise.all(
          proj.boards.map(async (b) => {
            const view = b.workspace?.view
            if (!view || !isGeometricView(view)) return null
            const res = await window.fetch(`/api/boards/${b._id}`).then((r) => (r.ok ? r.json() : null))
            const objects: BoardObject[] = res?.board?.objects ?? []
            const bbox = objectsBBoxCm(objects)
            if (!bbox) return null
            return [view, validateBoceto(rule, bboxToMeasures(view, bbox))] as const
          }),
        )
        if (!ignore) setReports(Object.fromEntries(entries.filter(Boolean) as [string, BocetoReport][]))
      })
      .catch(() => { if (!ignore) setNotFound(true) })
      .finally(() => { if (!ignore) setLoading(false) })
    return () => { ignore = true }
  }, [projectId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-zinc-500 font-mono text-sm">Cargando expediente…</div>
  }
  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white text-zinc-600">
        <p className="font-sans">{'Proyecto no encontrado.'}</p>
        <Link href="/dashboard/workspaces" className="font-mono text-xs uppercase tracking-widest text-blue-600 hover:underline">← Workspace</Link>
      </div>
    )
  }

  const rule = getCarnavalRule(project.modality)
  const range = (a: CarnavalAxis) => {
    const r = rule.dims[a]
    if (!r) return '—'
    if (r.exact != null) return `${r.exact} (exacto)`
    return `${r.min ?? '—'} … ${r.max ?? '—'}`
  }

  return (
    <div className="min-h-screen bg-zinc-100 print:bg-white py-8 print:py-0">
      {/* Barra de acciones (oculta al imprimir) */}
      <div className="print:hidden max-w-[820px] mx-auto mb-4 flex items-center justify-between px-4">
        <Link href={`/dashboard/workspaces/${projectId}`} className="font-mono text-xs uppercase tracking-widest text-blue-600 hover:underline">← Proyecto</Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 text-white font-mono text-xs uppercase tracking-widest hover:opacity-90">
          <span className="material-symbols-outlined text-[18px]">print</span>
          {'Imprimir / Guardar PDF'}
        </button>
      </div>

      {/* Documento */}
      <article className="max-w-[820px] mx-auto bg-white text-zinc-900 shadow print:shadow-none px-12 py-10 print:px-0 print:py-0 font-sans">
        {/* Portada */}
        <header className="border-b-2 border-zinc-900 pb-5 mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Expediente Técnico · Corpocarnaval {project.year}</p>
          <h1 className="text-3xl font-bold mt-2 tracking-tight">{project.name}</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 mt-2">
            {`${rule.label} · Escala 1:${rule.scale}`}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-[11px] text-zinc-700">
            <div>Modalidad: <span className="font-semibold">{rule.label}</span></div>
            <div>{'Año: '}<span className="font-semibold">{project.year}</span></div>
            <div>Estado: <span className="font-semibold uppercase">{project.accreditationStatus}</span></div>
            <div>Autor: <span className="inline-block min-w-[120px] border-b border-zinc-400">&nbsp;</span></div>
          </div>
        </header>

        {/* Ficha técnica */}
        <section className="mb-7 break-inside-avoid">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 border-b border-zinc-300 pb-1 mb-3">{'Ficha técnica'}</h2>
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="text-left text-zinc-500 font-mono text-[10px] uppercase">
                <th className="py-1.5 pr-4">{'Dimensión'}</th>
                <th className="py-1.5 pr-4">{'Rango (cm, boceto)'}</th>
                <th className="py-1.5">Obra real (×{rule.scale})</th>
              </tr>
            </thead>
            <tbody>
              {AXES.map((a) => rule.dims[a] && (
                <tr key={a} className="border-t border-zinc-200">
                  <td className="py-1.5 pr-4 font-medium">{AXIS_LABEL[a]}</td>
                  <td className="py-1.5 pr-4 font-mono">{range(a)}</td>
                  <td className="py-1.5 font-mono text-zinc-600">
                    {rule.dims[a]?.max != null ? `≤ ${(rule.dims[a]!.max! * rule.scale / 100).toFixed(2)} m` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-[11px] text-zinc-700">
            <div>Base: <span className="font-semibold">{rule.base.type} {rule.base.ancho}×{rule.base.largo}×{rule.base.espesor} cm{rule.base.color ? ` (${rule.base.color})` : ''}</span></div>
            <div>Base exacta: <span className="font-semibold">{rule.base.exact ? 'Sí' : 'No'}</span></div>
            {rule.humanRefCm != null && <div>Figura humana: <span className="font-semibold">{rule.humanRefCm} cm (hombros)</span></div>}
            <div>Bocetos a presentar: <span className="font-semibold">{rule.bocetosRequeridos}</span></div>
          </div>
        </section>

        {/* Planos */}
        <section className="mb-7">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 border-b border-zinc-300 pb-1 mb-3">Planos</h2>
          <div className="grid grid-cols-2 gap-4">
            {project.boards.map((b) => {
              const view = b.workspace?.view
              const axes = view && isGeometricView(view) ? VIEW_AXES[view] : null
              return (
                <figure key={b._id} className="break-inside-avoid border border-zinc-300 rounded">
                  <div className="aspect-square bg-zinc-50 border-b border-zinc-200 flex items-center justify-center overflow-hidden">
                    {b.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.thumbnailUrl} alt={view ? planoLabel(view) : b.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-zinc-300">draft</span>
                    )}
                  </div>
                  <figcaption className="px-2.5 py-2">
                    <p className="font-semibold text-sm">{view ? planoLabel(view) : b.name}</p>
                    {axes && (
                      <p className="font-mono text-[10px] text-zinc-500 uppercase">{`Valida ${AXIS_LABEL[axes.height].toLowerCase()} · ${AXIS_LABEL[axes.width].toLowerCase()}`}</p>
                    )}
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </section>

        {/* Informe reglamentario */}
        <section className="break-inside-avoid">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500 border-b border-zinc-300 pb-1 mb-3">Informe reglamentario</h2>
          {project.boards.filter((b) => b.workspace?.view && isGeometricView(b.workspace.view)).map((b) => {
            const view = b.workspace!.view as CarnavalPlano
            const rep = reports[view]
            return (
              <div key={b._id} className="flex items-start justify-between gap-4 py-1.5 border-t border-zinc-200 first:border-t-0">
                <div className="min-w-0">
                  <span className="font-medium text-[12px]">{planoLabel(view)}</span>
                  {rep && rep.observations.length > 0 && (
                    <ul className="mt-0.5">
                      {rep.observations.map((o, i) => (
                        <li key={i} className="font-mono text-[10px] text-red-600">• {o}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <span className={`font-mono text-[11px] shrink-0 ${!rep ? 'text-zinc-400' : rep.compliant ? 'text-green-700' : 'text-red-600'}`}>
                  {rep ? `${rep.compliancePct}%` : 'sin datos'}
                </span>
              </div>
            )
          })}
          {rule.requiresPlayerZones && (
            <p className="font-mono text-[10px] text-amber-600 mt-2">{'⚠ Verificar manualmente la delimitación de zonas de jugadores.'}</p>
          )}
          <p className="font-mono text-[9px] text-zinc-400 mt-4 pt-3 border-t border-zinc-200">
            {'Generado por ArtSanctuary · Las medidas de base deben verificarse físicamente. Documento de apoyo, no sustituye la revisión oficial de Corpocarnaval.'}
          </p>
        </section>
      </article>
    </div>
  )
}
