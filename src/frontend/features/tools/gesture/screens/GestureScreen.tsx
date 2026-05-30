'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import { useState } from 'react'
import { usePreferences } from '@frontend/shared/providers/AppPreferencesProvider'

export default function GesturePage() {
  const { locale } = usePreferences()
  const [duration, setDuration] = useState(30)

  const copy = locale === 'en'
    ? {
        duration: 'DURATION',
        category: 'CATEGORY: HUMAN FIGURE',
        state1: 'STATE 1 - PAUSED',
        state2: 'STATE 2 - ACTIVE',
        login: 'SIGN IN',
        image: 'IMAGE 1 / 12',
        remaining: 'REMAINING TIME',
      }
    : {
        duration: 'DURACIÓN',
        category: 'CATEGORÍA: FIGURA HUMANA',
        state1: 'ESTADO 1 - PAUSADO',
        state2: 'ESTADO 2 - ACTIVO',
        login: 'INICIAR SESIÓN',
        image: 'IMAGEN 1 / 12',
        remaining: 'TIEMPO RESTANTE',
      }

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-16 border-b border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] flex items-center p-4 gap-6 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-4 flex-1 min-w-[300px]">
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{copy.duration}</span>
            <div className="flex-1 max-w-xs flex items-center gap-3">
              <input 
                className="w-full custom-range" 
                max="120" min="15" type="range" 
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] w-8 text-right uppercase">{duration}S</span>
          </div>
          
          <div className="w-px h-6 bg-[var(--color-outline-variant)]"></div>
          
          <div className="relative">
            <button className="flex items-center gap-2 font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase tracking-widest hover:text-[var(--color-on-surface-variant)] transition-colors whitespace-nowrap">
              <span>{copy.category}</span>
              <span className="material-symbols-outlined text-sm">arrow_drop_down</span>
            </button>
          </div>
        </div>
        
        {/* Main Work Area (Split Panels) */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-px bg-[var(--color-outline-variant)] overflow-hidden min-h-0">
          {/* Panel 1: ESTADO 1 — PAUSADO */}
          <div className="bg-[var(--color-surface-container-lowest)] flex flex-col relative h-full group">
            <div className="absolute top-4 left-4 z-10 bg-[var(--color-surface)]/80 backdrop-blur px-4 py-2 border border-[var(--color-outline-variant)]">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{copy.state1}</span>
            </div>
            {/* Image Container with Overlay */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 min-h-[300px]">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB2E8_OFnVsJVOEZp76VW903NaOSqzTvJ8YaCLeq_m5At8X9zLZX4LIvPxRDXHpvw0d6-1D5SodPa3ulk8iMA_AFjlQqy9qun44cD2zFZubzzmFJszMvRLsrioNaOwJrxrbAKiHLKA1Jv5JzOkPyTd6wAa6bWuxKuFq_weX5V7v5HMwt3v6Nc3MJ2BSVaU3EUxXd0U7qd7jUxx5BwOUBTKOVihtGuGTXk93lqKxEBbVwhvyJPRkvpI8X3HubtwmPqrRmL6aPtT2jNya')" }}
              ></div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-[var(--color-background)]/70 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity">
                <button className="bg-[var(--color-primary)] text-[var(--color-background)] font-mono text-[var(--text-label-sm)] uppercase tracking-widest py-4 px-8 border border-transparent hover:bg-transparent hover:border-[var(--color-outline)] hover:text-[var(--color-primary)] transition-all duration-300 shadow-lg">
                  {copy.login}
                </button>
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] mt-6 uppercase tracking-widest">{copy.image}</span>
              </div>
            </div>
          </div>
          
          {/* Panel 2: ESTADO 2 — ACTIVO */}
          <div className="bg-[var(--color-surface-container-lowest)] flex flex-col relative h-full">
            <div className="absolute top-4 left-4 z-10 bg-[var(--color-surface)]/80 backdrop-blur px-4 py-2 border border-[var(--color-outline-variant)]">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{copy.state2}</span>
            </div>
            {/* Active Image Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 pb-32 min-h-[300px]">
              <img 
                alt="Classical academic drawing" 
                className="w-full h-full object-contain filter grayscale contrast-125" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbIw6FXpAkp0sDnfHmrum70IRWJ-GC6XQnIb_GLbUx3tJ472GAvtKpmuRRmRfU08dwOcRr8d12dyUF0cIB_IiViYkWtwZu74XmnFxkZa_euIRxIBonoDa_9Aqn3GmQZBq_jF3IRISl1mJ2uxjLKP7TDs1nGtkDWB62bznMVSwHiyJFG_S1NmRYDx78xDSDUXmktn_kWE-rNMt39ySl5igyuiLR0nOVSjfGOKZTTcOYSDo9FigesbC1XTOUJ22puDwG-IckTo576sGf"
              />
            </div>
            {/* Timer Section */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[var(--color-background)]/90 backdrop-blur-md border-t border-[var(--color-outline-variant)] flex flex-col justify-end p-6">
              <div className="flex items-end justify-between mb-6">
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">{copy.remaining}</span>
                <span className="font-display text-[48px] text-[var(--color-primary)] leading-none uppercase">
                  {Math.round(duration * 0.8)}<span className="text-[24px] text-[var(--color-on-surface-variant)] ml-1">S</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-[2px] bg-[var(--color-outline-variant)] relative overflow-hidden">
                <div className="absolute top-0 left-0 bottom-0 bg-[var(--color-primary)] transition-all duration-1000 ease-linear" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
