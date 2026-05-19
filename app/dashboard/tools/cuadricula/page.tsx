'use client'

import AppShell from '@/components/layout/AppShell'
import ToolActiveLayout from '@/components/tools/ToolActiveLayout'
import { useState } from 'react'

export default function CuadriculaPage() {
  const [cols, setCols] = useState(8)
  const [rows, setRows] = useState(8)
  const [opacity, setOpacity] = useState(30)
  const [color, setColor] = useState('#ffffff')

  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${color}${Math.floor(opacity * 2.55).toString(16).padStart(2, '0')} 1px, transparent 1px),
                      linear-gradient(to bottom, ${color}${Math.floor(opacity * 2.55).toString(16).padStart(2, '0')} 1px, transparent 1px)`,
    backgroundSize: `${100 / cols}% ${100 / rows}%`
  }

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-[52px] bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex items-center px-[var(--spacing-grid-gutter)] shrink-0 gap-8 overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase">COLUMNAS</span>
            <input 
              className="w-24 custom-range" 
              max="20" min="1" type="range" 
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] w-4 text-center">{cols}</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--color-outline-variant)] opacity-50"></div>
          
          <div className="flex items-center gap-3">
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase">FILAS</span>
            <input 
              className="w-24 custom-range" 
              max="20" min="1" type="range" 
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] w-4 text-center">{rows}</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--color-outline-variant)] opacity-50"></div>
          
          <div className="flex items-center gap-3">
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase">OPACIDAD</span>
            <input 
              className="w-24 custom-range" 
              max="100" min="0" type="range" 
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] w-8 text-right">{opacity}%</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--color-outline-variant)] opacity-50"></div>
          
          <div className="flex items-center gap-3">
            <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase">COLOR</span>
            <div className="w-5 h-5 rounded-sm border border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] transition-colors relative overflow-hidden ring-2 ring-transparent focus-within:ring-[var(--color-primary)]/30">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-grid-gutter)] overflow-auto flex items-center justify-center relative min-h-0">
          <div className="relative max-w-[800px] w-full aspect-video border border-[var(--color-outline-variant)] shadow-2xl bg-[var(--color-surface)] group transition-transform duration-500 ease-out hover:scale-[1.01]">
            <img 
              alt="Classical portrait sculpture" 
              className="w-full h-full object-cover opacity-80 mix-blend-luminosity filter contrast-125" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6s40zJqvBfuLCR0eyhTFMr6l8_46VhVnV00nWJ71QR-slxb_-JPDCvnAMjUGR5PYzQbDrCMiXapviXGhN3MlD2GdoaejwgJVDYqzz9oxRqpZR7Nrzsz4Chuv8Ehl_neE6jK12BsY-H2wUdfk-x7BotEW6QrjJh7J_ML7TygNJoF7uc_2x8bAh4JMjfc3pF7qSGg13DSBNo-rONHHbv_YEstiSIlNwTmSdzDNUu7NLYyIEEMlurzFWYNbOrewMGi5i8s71aP7Uapgo"
            />
            <div 
              className="absolute inset-0 border border-[var(--color-primary)]/20 pointer-events-none"
              style={gridStyle}
            ></div>
            
            <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="h-8 px-3 bg-[var(--color-surface)]/80 backdrop-blur-md border border-[var(--color-outline-variant)] font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">download</span>
                EXPORTAR
              </button>
            </div>
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
