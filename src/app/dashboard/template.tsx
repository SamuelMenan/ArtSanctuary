'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { transition } from '@frontend/shared/motion/tokens'

// Template (no layout): se re-monta en cada navegación dentro de /dashboard, así
// que un fade de entrada suaviza el cambio de tool/vista. La chrome (sidebars/
// navbar) vive en ChromeProvider raíz y conserva su estado → el conjunto se
// siente continuo, casi sin notar el cambio.
export default function DashboardTemplate({ children }: { children: ReactNode }) {
  return (
    <motion.div
      // Debe llenar la sección y propagar el contexto flex en columna: las tools
      // de lienzo (boards) dependen de una altura definida para medir el Stage.
      className="flex-1 flex flex-col min-h-0 min-w-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transition.fast}
    >
      {children}
    </motion.div>
  )
}
