'use client'

import Image from 'next/image'
import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import { useState } from 'react'

export default function NotanPage() {
  const [umbral, setUmbral] = useState(128)
  const [tonoMedio, setTonoMedio] = useState(false)

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex items-center px-[var(--spacing-grid-gutter)] justify-between shrink-0 z-10 overflow-x-auto">
          {/* Left Actions */}
          <div className="flex items-center">
            <button className="flex items-center gap-[var(--spacing-stack-sm)] px-4 py-2 border border-[var(--color-outline)] rounded-[var(--radius-sm)] text-[var(--color-on-background)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors duration-200 font-mono text-[var(--text-label-sm)] group whitespace-nowrap">
              <span className="material-symbols-outlined text-[18px] group-hover:text-[var(--color-primary)]">image</span>
              SELECCIONAR IMAGEN
            </button>
          </div>
          
          {/* Center Controls */}
          <div className="flex items-center gap-8 px-4">
            {/* Slider Control */}
            <div className="flex items-center gap-4 w-48">
              <label className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] shrink-0" htmlFor="umbral-slider">UMBRAL</label>
              <input 
                className="flex-1 custom-range" 
                id="umbral-slider" 
                max="255" min="0" type="range" 
                value={umbral}
                onChange={(e) => setUmbral(Number(e.target.value))}
              />
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-background)] shrink-0 w-8 text-right">{umbral}</span>
            </div>
            
            {/* Checkbox Control */}
            <div className="flex items-center gap-[var(--spacing-stack-sm)] cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  className="peer appearance-none w-4 h-4 border border-[var(--color-outline-variant)] rounded-sm bg-transparent checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] transition-colors cursor-pointer" 
                  id="tono-medio-check" 
                  type="checkbox"
                  checked={tonoMedio}
                  onChange={(e) => setTonoMedio(e.target.checked)}
                />
                <span className="material-symbols-outlined absolute text-background text-[14px] pointer-events-none opacity-0 peer-checked:opacity-100 left-0 top-0 h-full w-full flex items-center justify-center">check</span>
              </div>
              <label className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] group-hover:text-[var(--color-on-background)] transition-colors cursor-pointer select-none whitespace-nowrap" htmlFor="tono-medio-check">TONO MEDIO</label>
            </div>
          </div>
          
          {/* Right Status */}
          <div className="flex items-center">
            <span className="bg-[var(--color-secondary-container)] text-[var(--color-on-background)] font-mono text-[var(--text-label-sm)] px-3 py-1.5 rounded-full tracking-wider border border-[var(--color-outline-variant)] whitespace-nowrap">
              {tonoMedio ? '3 VALORES' : '2 VALORES'}
            </span>
          </div>
        </div>
        
        {/* Split Workspace Panels */}
        <div className="flex-1 flex flex-col md:flex-row bg-[var(--color-surface-container-lowest)] overflow-hidden min-h-0">
          {/* Left Panel: Original */}
          <div className="flex-1 relative flex items-center justify-center p-[var(--spacing-grid-gutter)] min-h-[300px]">
            <div className="absolute top-[var(--spacing-grid-gutter)] left-[var(--spacing-grid-gutter)] z-10">
              <span className="bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-outline-variant)] text-[var(--color-secondary)] font-mono text-[var(--text-label-sm)] px-3 py-1 rounded-[var(--radius-sm)] shadow-sm">
                ORIGINAL
              </span>
            </div>
            <div className="w-full h-full max-w-2xl relative flex items-center justify-center">
              <Image 
                alt="Original Classical Sculpture" 
                width={600}
                height={400}
                className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl opacity-90 mix-blend-luminosity" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtfKKWcn8Gd0pUV8KxK5jTEK97SZ8zGooOMObgK004RrUvtoQ-5YvDcJOXIiojInz7vJEMfQSMghjV6TbliyBYyRzOSxp6VByUHgEwOPCPooYcRjRu9Poz_4kmuvXDhQDGgMfE1tNf_VEAai_es0jIqQ-kTk4aZLhlzY5OClHK6hBBZ9OAbKKG2E_jgVhHxODzkWc29mO8wvFhovOJj6g8qgXoVthbc3lPqN8ofrarUY2RaoiAWjnqw6uC4GauusUtpb9Tgs5uncX0"
              />
            </div>
          </div>
          
          {/* Central Divider */}
          <div className="w-full h-[1px] md:w-[1px] md:h-full bg-[var(--color-outline-variant)] shrink-0"></div>
          
          {/* Right Panel: Notan */}
          <div className="flex-1 relative flex items-center justify-center p-[var(--spacing-grid-gutter)] bg-[#0a0a0a] min-h-[300px]">
            <div className="absolute top-[var(--spacing-grid-gutter)] left-[var(--spacing-grid-gutter)] z-10">
              <span className="bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-outline-variant)] text-[var(--color-primary)] font-mono text-[var(--text-label-sm)] px-3 py-1 rounded-[var(--radius-sm)] shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] inline-block"></span>
                NOTAN
              </span>
            </div>
            <div className="w-full h-full max-w-2xl relative flex items-center justify-center">
              <Image 
                alt="Notan Processed Sculpture" 
                width={600}
                height={400}
                className="max-w-full max-h-full object-contain pointer-events-none" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApaJRfmjdSNpbDzgjJ7F3zfodETgXuHWh8kq8vlWhQhh2zC0mMPGwNJ2NZJjGaxUkPMMX9ybFExCyp378p6GQU6f1RKCKvM2d5qmMMKbtcayiwh-0t_S8IGDuwJXMlrPFk7_41j3wc-GZYl4aW77wADqPKy36XtUnFbaSVv5PdoeUho9bPeoy-2Bl4EM_1hZnWOPXv7F-pkNbe1Aqcw6OpExsK7jWlJSd03lUicmX9PQUjl_Vz8pa5Mi8FoaOZu_IISA6OmR7n-MDO" 
                style={{ filter: `grayscale(100%) contrast(1000%) brightness(${umbral / 128})` }}
              />
            </div>
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
