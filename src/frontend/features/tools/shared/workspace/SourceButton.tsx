'use client'

import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'
import ToolButton from './ToolButton'

/** Botón unificado de "cambiar foto" (mismo label/estilo en las 3 herramientas). */
export default function SourceButton({ onClick }: { onClick: () => void }) {
  const { t } = usePreferences()
  return <ToolButton variant="ghost" icon="imagesmode" label={t('tools.changePhoto')} onClick={onClick} />
}
