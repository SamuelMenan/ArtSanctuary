import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'

/**
 * Layout del dashboard: la chrome (sidebars + navbar + rail de herramientas) vive
 * AQUÍ, no en cada página. Un layout del App Router NO se re-monta al navegar entre
 * sus rutas hijas → la chrome persiste y solo cambia el contenido (con el fade de
 * `template.tsx`). `ToolActiveLayout` deduce el contexto de workspace de la URL,
 * así que sirve a los 2 espacios (HERRAMIENTAS / WORKSPACE+VISTAS+HERRAMIENTAS).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ToolActiveLayout>{children}</ToolActiveLayout>
    </AppShell>
  )
}
