'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/** Botón unificado de "cambiar foto" (full-width en el panel de la herramienta). */
export default function SourceButton({ onClick }: { onClick: () => void }) {
  const { t } = usePreferences()
  return <ToolButton variant="primary" icon="imagesmode" label={t('tools.changePhoto')} onClick={onClick} className="w-full" />
}
