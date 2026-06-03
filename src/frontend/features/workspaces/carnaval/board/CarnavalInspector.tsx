import type { BoardObject } from '@shared/lib/boards/types'
import {
  type CarnavalRule,
  type CarnavalPlano,
  type ComplianceStatus,
  VIEW_AXES,
  isGeometricView,
  planoLabel,
  planosForModality,
  validateBoceto,
} from '@shared/lib/workspaces/carnaval'
import { objectsBBoxCm, bboxToMeasures } from '../lib/carnavalInspect'

/** Icono Material + color por estado de cumplimiento. */
const STATUS_UI: Record<ComplianceStatus, { icon: string; cls: string }> = {
  ok: { icon: 'check_circle', cls: 'text-green-600' },
  warn: { icon: 'warning', cls: 'text-amber-500' },
  under: { icon: 'cancel', cls: 'text-red-600' },
  over: { icon: 'cancel', cls: 'text-red-600' },
  mismatch: { icon: 'error', cls: 'text-red-600' },
  na: { icon: 'remove', cls: 'text-[var(--color-on-surface-variant)]' },
}

const Row = ({ status, text }: { status: ComplianceStatus; text: string }) => {
  const ui = STATUS_UI[status]
  return (
    <div className="flex items-start gap-2 py-1">
      <span className={`material-symbols-outlined text-[16px] leading-5 ${ui.cls}`}>{ui.icon}</span>
      <span className="font-mono text-[11px] text-[var(--color-on-surface)] leading-5">{text}</span>
    </div>
  )
}

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5">
      {label}
    </h3>
    {children}
  </div>
)

/**
 * Inspector de Acreditación (Fase 7). Valida la vista activa contra el
 * reglamento, lista el estado de las 5 vistas del proyecto, los requisitos de
 * la modalidad y las observaciones técnicas. Panel lateral deslizable.
 */
export default function CarnavalInspector({
  rule,
  view,
  objects,
  onClose,
  onSelectView,
}: {
  rule: CarnavalRule
  view: CarnavalPlano
  objects: BoardObject[]
  onClose: () => void
  onSelectView: (v: CarnavalPlano) => void
}) {
  const bbox = objectsBBoxCm(objects)
  const geometric = isGeometricView(view)
  const report = bbox && geometric ? validateBoceto(rule, bboxToMeasures(view, bbox)) : null
  const pct = report?.compliancePct ?? 0
  const planos = planosForModality(rule.id)

  const pctColor =
    pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-amber-500' : 'text-red-600'

  return (
    <div className="absolute top-0 right-0 h-full w-72 z-30 bg-[var(--color-surface-container)] border-l border-[var(--color-outline-variant)] shadow-xl flex flex-col">
      {/* Cabecera */}
      <div className="px-4 py-3 border-b border-[var(--color-outline-variant)] flex items-center justify-between">
        <div>
          <h2 className="font-sans font-bold text-[var(--color-primary)] text-sm">{rule.label}</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
            {`Inspector · 1:${rule.scale}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="size-8 flex items-center justify-center rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]"
          title="Cerrar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Estado global */}
      <div className="px-4 py-3 border-b border-[var(--color-outline-variant)] flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]">
          {'Estado global'}
        </span>
        <span className={`font-display-lg text-2xl font-bold ${pctColor}`}>
          {bbox ? `${pct}%` : '—'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
        {/* Plano activo: ejes medidos (geométrico) o pista (especial) */}
        <Section label={`Plano activo · ${planoLabel(view)}`}>
          {!geometric ? (
            <p className="font-mono text-[11px] text-[var(--color-on-surface-variant)]">
              {view === 'jugadores'
                ? 'Delimita las zonas de jugadores sobre la base.'
                : 'Organiza soportes y estructuras sobre la base.'}
            </p>
          ) : !bbox ? (
            <p className="font-mono text-[11px] text-[var(--color-on-surface-variant)]">
              {'Dibuja para medir la envolvente.'}
            </p>
          ) : report?.results.length === 0 ? (
            <p className="font-mono text-[11px] text-[var(--color-on-surface-variant)]">
              {'Sin ejes que validar en este plano.'}
            </p>
          ) : (
            report?.results.map((r) => <Row key={r.axis} status={r.status} text={r.message} />)
          )}
        </Section>

        {/* Planos del proyecto (según modalidad) */}
        <Section label="Planos del proyecto">
          {planos.map((v) => {
            const active = v === view
            return (
              <button
                key={v}
                onClick={() => onSelectView(v)}
                className={`w-full flex items-center justify-between py-1 ${active ? '' : 'opacity-70 hover:opacity-100'}`}
              >
                <span className="font-mono text-[11px] text-[var(--color-on-surface)]">{planoLabel(v)}</span>
                {active && geometric ? (
                  <span className={`font-mono text-[10px] ${pctColor}`}>{bbox ? `${pct}%` : '—'}</span>
                ) : active ? (
                  <span className="material-symbols-outlined text-[15px] text-[var(--color-on-surface-variant)]" title="Activo">edit</span>
                ) : (
                  <span className="material-symbols-outlined text-[15px] text-amber-500" title="Pendiente">schedule</span>
                )}
              </button>
            )
          })}
          <p className="font-mono text-[9px] uppercase tracking-wide text-[var(--color-on-surface-variant)] mt-1.5">
            {'Cambia de plano para validar cada uno'}
          </p>
        </Section>

        {/* Requisitos de la modalidad */}
        <Section label="Requisitos">
          <Row
            status={rule.base.exact ? 'warn' : 'na'}
            text={`Base ${rule.base.type}: ${rule.base.ancho}×${rule.base.largo}×${rule.base.espesor} cm${rule.base.color ? ` (${rule.base.color})` : ''} — exacta, verificar manual`}
          />
          {rule.humanRefCm != null && (
            <Row status="na" text={`Figura humana: ${rule.humanRefCm} cm hasta hombros`} />
          )}
          {rule.requiresPlayerZones && (
            <Row status="warn" text="Delimitar zonas de jugadores — pendiente" />
          )}
          <Row status="na" text={`Bocetos a presentar: ${rule.bocetosRequeridos}`} />
        </Section>

        {/* Observaciones técnicas */}
        {report && report.observations.length > 0 && (
          <Section label="Observaciones técnicas">
            {report.observations.map((o, i) => (
              <Row key={i} status="over" text={o} />
            ))}
          </Section>
        )}

        {/* Notas oficiales */}
        <Section label="Notas Corpocarnaval">
          {rule.notes.map((n, i) => (
            <p key={i} className="font-mono text-[10px] text-[var(--color-on-surface-variant)] leading-4 mb-1">
              {`• ${n}`}
            </p>
          ))}
        </Section>
      </div>
    </div>
  )
}
