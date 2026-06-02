import AppShell from '@frontend/shared/layouts/AppShell'
import Link from 'next/link'

export default function ToolsDashboardPage() {
  const tools = [
    {
      title: 'Boards',
      desc: 'Lienzo infinito tipo Miro: imágenes, texto y figuras sobre papel milimetrado. Guarda tus tableros por cuenta.',
      icon: 'dashboard',
      badge: 'FREE',
      href: '/dashboard/boards'
    },
    {
      title: 'Recorte',
      desc: 'Recorta imágenes (manual y automático) y quita el fondo (IA o varita mágica). Exporta PNG.',
      icon: 'crop',
      badge: 'FREE',
      href: '/dashboard/tools/crop'
    },
    {
      title: 'Cuadrícula de Referencia',
      desc: 'Superpone una rejilla sobre tus imágenes de referencia.',
      icon: 'select_all',
      badge: 'FREE',
      href: '/dashboard/tools/grid'
    },
    {
      title: 'Notan',
      desc: 'Simplifica valores de luz y sombra para composiciones fuertes.',
      icon: 'contrast',
      badge: 'FREE',
      href: '/dashboard/tools/notan'
    },
    {
      title: 'Mezcla de Colores',
      desc: 'Experimenta con mezclas digitales de pigmentos tradicionales.',
      icon: 'palette',
      badge: 'FREE',
      href: '/dashboard/tools/color-mixing'
    },
    {
      title: 'Gesture Drawing',
      desc: 'Sesiones de práctica cronometradas con referencias aleatorias.',
      icon: 'schedule',
      badge: 'FREE',
      href: '/dashboard/tools/gesture'
    },
    {
      title: 'Canon de Proporciones',
      desc: 'Guía técnica de proporciones humanas basada en unidades de cabeza para estudios anatómicos.',
      icon: 'accessibility_new',
      badge: 'FREE',
      href: '/dashboard/tools/canon'
    }
  ]

  return (
    <AppShell>
      <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto z-10 relative">
        <header className="mb-12">
          <h1 className="font-display-lg text-display-lg text-[var(--color-primary)] font-bold mb-4 tracking-[-0.02em] leading-[1.1] uppercase">
            HERRAMIENTAS
          </h1>
          <p className="font-mono text-label-sm tracking-[0.05em] text-[var(--color-on-surface-variant)] uppercase">
            Utilidades de Asistencia Rápida. Todo corre en tu navegador
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[var(--spacing-grid-gutter)]">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.href} className="block group h-full">
              <div className="bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] rounded-[var(--radius-xl)] p-8 transition-all duration-300 group-hover:border-[var(--color-outline)] group-hover:-translate-y-1 group-hover:bg-[var(--color-surface-container-high)] flex flex-col h-full cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                  <div className="size-16 bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)] flex items-center justify-center overflow-hidden">
                    <span className="material-symbols-outlined text-[32px] text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] transition-colors">
                      {tool.icon}
                    </span>
                  </div>
                  <span className="px-3 py-1 font-mono text-[10px] tracking-widest uppercase border border-[var(--color-outline-variant)] text-[var(--color-on-surface-variant)] rounded-full group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                    {tool.badge}
                  </span>
                </div>
                
                <h2 className="font-sans text-headline-md text-[var(--color-primary)] font-semibold mb-3">
                  {tool.title}
                </h2>
                <p className="font-sans text-body-md text-[var(--color-on-surface-variant)] leading-[1.6]">
                  {tool.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}