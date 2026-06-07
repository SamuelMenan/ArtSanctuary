'use client'

import Link from 'next/link'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

type CulturalResource = {
  id: string;
  title: string;
  category: 'reglamento' | 'guia' | 'plantilla' | 'comunicado';
  description: string;
  icon: string;
  href: string;
};

const RESOURCES: CulturalResource[] = [
  {
    id: 'reg-2027',
    title: 'Reglamento Oficial 2027',
    category: 'reglamento',
    description: 'Documento completo con normativas, modalidades y sanciones vigentes.',
    icon: 'gavel',
    href: '#',
  },
  {
    id: 'guia-acred',
    title: 'Guía de Acreditación',
    category: 'guia',
    description: 'Paso a paso para preparar y enviar la documentación requerida.',
    icon: 'assignment_turned_in',
    href: '#',
  },
  {
    id: 'plantilla-planos',
    title: 'Plantillas de Presentación',
    category: 'plantilla',
    description: 'Formatos oficiales en PDF para la entrega de vistas frontal, lateral y posterior.',
    icon: 'design_services',
    href: '#',
  },
  {
    id: 'com-2027-01',
    title: 'Comunicado 01 - Cronograma',
    category: 'comunicado',
    description: 'Fechas importantes para inscripciones, revisiones y desfiles.',
    icon: 'campaign',
    href: '#',
  },
  {
    id: 'reg-hist',
    title: 'Reglamentos Históricos',
    category: 'reglamento',
    description: 'Archivo de normativas de años anteriores para consulta y referencia.',
    icon: 'history',
    href: '#',
  },
  {
    id: 'guia-seguridad',
    title: 'Protocolos de Seguridad',
    category: 'guia',
    description: 'Requisitos de extintores, circulación y materiales permitidos en talleres.',
    icon: 'health_and_safety',
    href: '#',
  }
];

export default function RecursosCulturalesScreen({ projectId }: { projectId: string }) {
  const { t } = usePreferences()

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="pt-8 pb-12 px-[var(--spacing-grid-gutter)] w-full max-w-[1400px] mx-auto">
            <Link 
              href={`/dashboard/workspaces/${projectId}`} 
              className="font-mono text-label-sm uppercase tracking-widest text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver al Proyecto
            </Link>

            <header className="mt-8 mb-10">
              <h1 className="font-display-lg text-display-sm text-[var(--color-primary)] font-bold tracking-[-0.02em] leading-[1.1]">
                Biblioteca Cultural
              </h1>
              <p className="font-sans text-body-lg text-[var(--color-on-surface-variant)] mt-3 max-w-2xl">
                Accede a toda la documentación oficial, guías de acreditación y recursos de diseño proporcionados por Corpocarnaval sin salir de tu entorno de trabajo.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RESOURCES.map((resource) => (
                <a 
                  key={resource.id} 
                  href={resource.href}
                  className="flex flex-col gap-4 p-6 rounded-[var(--radius-xl)] bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-12 rounded-2xl bg-[var(--color-surface-container-highest)] flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] transition-colors">
                      <span className="material-symbols-outlined text-[24px]">{resource.icon}</span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] px-2.5 py-1 rounded-full bg-[var(--color-surface-container-highest)]">
                      {resource.category}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-sans text-title-md font-semibold text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)] transition-colors">
                      {resource.title}
                    </h3>
                    <p className="font-sans text-body-sm text-[var(--color-on-surface-variant)] mt-2">
                      {resource.description}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Abrir documento</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-12 p-8 rounded-[var(--radius-2xl)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex flex-col sm:flex-row items-center gap-6">
              <div className="size-16 shrink-0 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-on-primary)]">
                <span className="material-symbols-outlined text-[32px]">info</span>
              </div>
              <div>
                <h3 className="font-sans text-title-lg font-bold text-[var(--color-on-surface)]">
                  ¿Necesitas plantillas editables?
                </h3>
                <p className="font-sans text-body-md text-[var(--color-on-surface-variant)] mt-1 max-w-2xl">
                  Recuerda que dentro del Workspace del proyecto ya hemos preparado tus lienzos utilizando las plantillas reglamentarias. Solo debes preocuparte por tu diseño.
                </p>
              </div>
            </div>

          </div>
        </div>
  )
}
