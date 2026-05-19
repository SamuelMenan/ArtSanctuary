"use client"

import Link from 'next/link'
import Button from './Button'

interface Props {
  className?: string
}

export default function UploadButton({ className = '' }: Props) {
  return (
    <Link href="/upload" aria-label="Subir obra" className={`w-full inline-block ${className}`}>
      <Button
        variant="primary"
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-md font-mono uppercase tracking-widest ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Subir obra
      </Button>
    </Link>
  )
}
