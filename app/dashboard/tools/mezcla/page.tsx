'use client'

import AppShell from '@/components/layout/AppShell'
import ToolActiveLayout from '@/components/tools/ToolActiveLayout'
import { useState } from 'react'

export default function MezclaPage() {
  const [proportion, setProportion] = useState(50)

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex items-center justify-between px-4 z-40 shrink-0 overflow-x-auto">
          {/* Tool Controls */}
          <div className="flex items-center gap-6 h-full min-w-max">
            {/* Pigment A Control */}
            <div className="flex items-center gap-3 h-full">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest">PIGMENTO A</span>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-transparent border border-[var(--color-outline)] hover:border-[var(--color-primary)] transition-colors group">
                <div className="size-4 rounded-sm bg-[#E30022] border border-[var(--color-outline)]/30"></div>
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] text-[18px] transition-colors">expand_more</span>
              </button>
            </div>
            
            <div className="w-px h-6 bg-[var(--color-outline-variant)]"></div>
            
            {/* Pigment B Control */}
            <div className="flex items-center gap-3 h-full">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest">PIGMENTO B</span>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-transparent border border-[var(--color-outline)] hover:border-[var(--color-primary)] transition-colors group">
                <div className="size-4 rounded-sm bg-[#120A8F] border border-[var(--color-outline)]/30"></div>
                <span className="material-symbols-outlined text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)] text-[18px] transition-colors">expand_more</span>
              </button>
            </div>
            
            <div className="w-px h-6 bg-[var(--color-outline-variant)] hidden sm:block"></div>
            
            {/* Proportion Control */}
            <div className="flex items-center gap-4 h-full w-64 hidden sm:flex">
              <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest whitespace-nowrap">PROPORCIÓN A</span>
              <div className="flex-1 flex items-center gap-3">
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">0%</span>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={proportion}
                  onChange={(e) => setProportion(Number(e.target.value))}
                  className="flex-1 custom-range"
                />
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-widest">100%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* WORKSPACE CANVAS */}
        <div className="flex-1 bg-[var(--color-surface-container-lowest)] flex flex-col items-center justify-between p-6 overflow-y-auto relative min-h-0">
          {/* Mixer Display */}
          <div className="flex-1 flex items-center justify-center w-full min-h-[400px]">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 max-w-5xl mx-auto w-full">
              {/* Pigment 1 Block */}
              <div className="flex flex-col items-center gap-6 group">
                <div className="w-[160px] h-[160px] bg-[#E30022] rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-500 ease-out group-hover:scale-105 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface)] uppercase tracking-widest">ROJO CADMIO</span>
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] opacity-60 uppercase tracking-widest">{proportion}%</span>
                </div>
              </div>
              
              <span className="font-display text-[32px] font-bold text-[var(--color-primary)]/40 select-none pb-0 lg:pb-10">+</span>
              
              {/* Pigment 2 Block */}
              <div className="flex flex-col items-center gap-6 group">
                <div className="w-[160px] h-[160px] bg-[#120A8F] rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-500 ease-out group-hover:scale-105 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface)] uppercase tracking-widest">AZUL ULTRAMAR</span>
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] opacity-60 uppercase tracking-widest">{100 - proportion}%</span>
                </div>
              </div>
              
              <span className="font-display text-[32px] font-bold text-[var(--color-primary)]/40 select-none pb-0 lg:pb-10">=</span>
              
              {/* Result Block */}
              <div className="flex flex-col items-center gap-6 group mt-6 lg:mt-0">
                <div className="w-[200px] h-[200px] bg-[#4B1A6E] rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_10px_40px_-10px_rgba(75,26,110,0.4)] transition-transform duration-500 ease-out group-hover:scale-105 relative overflow-hidden ring-1 ring-[var(--color-primary)]/20">
                  <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase tracking-widest font-bold">RESULTADO</span>
                  <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] tracking-wider uppercase">#4B1A6E</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Palette Dock */}
          <div className="w-full max-w-4xl bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-outline-variant)] rounded-lg p-6 flex flex-col items-center gap-6 shadow-2xl relative mt-6">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--color-primary)]/20 to-transparent"></div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-4 w-full justify-start md:justify-center">
              {/* Swatches */}
              <button className="size-12 rounded bg-[#FFFFFF] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Blanco Titanio"></button>
              <button className="size-12 rounded bg-[#2E3131] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Negro Marfil"></button>
              
              {/* Selected A */}
              <button className="size-12 rounded bg-[#E30022] shrink-0 border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(227,0,34,0.3)] relative group" title="Rojo Cadmio">
                <span className="absolute -top-2 -right-2 size-5 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-full flex items-center justify-center font-mono text-[10px] text-[var(--color-primary)]">A</span>
              </button>
              
              <button className="size-12 rounded bg-[#FFF600] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Amarillo Cadmio"></button>
              
              {/* Selected B */}
              <button className="size-12 rounded bg-[#120A8F] shrink-0 border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(18,10,143,0.3)] relative group" title="Azul Ultramar">
                <span className="absolute -top-2 -right-2 size-5 bg-[var(--color-surface)] border border-[var(--color-outline-variant)] rounded-full flex items-center justify-center font-mono text-[10px] text-[var(--color-primary)]">B</span>
              </button>
              
              <button className="w-12 h-12 rounded bg-[#635147] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Tierra Sombra"></button>
              <button className="w-12 h-12 rounded bg-[#CCAA2B] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Ocre Amarillo"></button>
              <button className="w-12 h-12 rounded bg-[#40826D] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Verde Viridian"></button>
              <button className="w-12 h-12 rounded bg-[#E32636] shrink-0 border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50 transition-colors shadow-sm relative group" title="Carmín Alizarina"></button>
            </div>
            <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-secondary)] uppercase tracking-widest text-center opacity-70">
              SELECCIONA UN PIGMENTO PARA A O B
            </div>
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
