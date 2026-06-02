"use client"

import Link from 'next/link'
import Button from './Button'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider';

interface Props {
  className?: string
}

export default function UploadButton({ className = '' }: Props) {
  const { t } = usePreferences();
  return (
    <Link href="/upload" aria-label={t('home.uploadArtwork')} className={`w-full inline-block ${className}`}>
      <Button
        variant="primary"
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-mono uppercase tracking-widest ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        {t('home.uploadArtwork')}
      </Button>
    </Link>
  )
}
