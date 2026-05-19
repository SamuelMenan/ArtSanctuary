'use client'

import AppShell from '@/components/layout/AppShell'
import ToolActiveLayout from '@/components/tools/ToolActiveLayout'
import { useState } from 'react'

export default function PapelMilimetradoPage() {
  const [cellSize, setCellSize] = useState(20)
  const [majorLine, setMajorLine] = useState(5)
  const [gridColor, setGridColor] = useState('#2e2b28')
  const [bgColor, setBgColor] = useState('#faf8f4')

  const gridStyle = {
    backgroundColor: bgColor,
    backgroundImage: `
      linear-gradient(${gridColor}99 1.5px, transparent 1.5px),
      linear-gradient(90deg, ${gridColor}99 1.5px, transparent 1.5px),
      linear-gradient(${gridColor}33 0.5px, transparent 0.5px),
      linear-gradient(90deg, ${gridColor}33 0.5px, transparent 0.5px)
    `,
    backgroundSize: `${cellSize * majorLine}px ${cellSize * majorLine}px, ${cellSize * majorLine}px ${cellSize * majorLine}px, ${cellSize}px ${cellSize}px, ${cellSize}px ${cellSize}px`,
    backgroundPosition: '-0.5px -0.5px, -0.5px -0.5px, -0.5px -0.5px, -0.5px -0.5px'
  }

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-14 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex flex-wrap items-center px-6 gap-6 z-10 font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] overflow-x-auto whitespace-nowrap">
          {/* Slider: Tamaño Celda */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <label className="uppercase">TAMAÑO CELDA: {cellSize}px</label>
            <input 
              className="flex-1 custom-range" 
              max="100" min="5" type="range" 
              value={cellSize} 
              onChange={(e) => setCellSize(Number(e.target.value))} 
            />
          </div>
          
          {/* Slider: Línea Gruesa Cada */}
          <div className="flex items-center gap-3 min-w-[220px]">
            <label className="uppercase">LÍNEA GRUESA CADA: {majorLine}</label>
            <input 
              className="flex-1 custom-range" 
              max="20" min="2" type="range" 
              value={majorLine}
              onChange={(e) => setMajorLine(Number(e.target.value))}
            />
          </div>
          
          <div className="w-px h-6 bg-[var(--color-outline-variant)] opacity-50 hidden md:block"></div>
          
          {/* Color Picker: Color Cuadrícula */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-4 h-4 rounded-sm border border-[var(--color-outline)] group-hover:border-[var(--color-primary)] transition-colors relative overflow-hidden">
              <input 
                type="color" 
                value={gridColor} 
                onChange={(e) => setGridColor(e.target.value)}
                className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
              />
            </div>
            <span className="group-hover:text-[var(--color-primary)] transition-colors">COLOR CUADRÍCULA</span>
          </div>
          
          {/* Color Picker: Color Fondo */}
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-4 h-4 rounded-sm border border-[var(--color-outline)] group-hover:border-[var(--color-primary)] transition-colors relative overflow-hidden">
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="absolute inset-[-10px] w-10 h-10 cursor-pointer"
              />
            </div>
            <span className="group-hover:text-[var(--color-primary)] transition-colors">COLOR FONDO</span>
          </div>
          
          <div className="flex-1"></div>
          
          {/* Export Action */}
          <button className="px-4 py-1.5 border border-[var(--color-outline)] hover:border-[var(--color-primary)] text-[var(--color-primary)] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">download</span>
            EXPORTAR PNG
          </button>
        </div>

        {/* Render Area */}
        <div className="flex-1 relative overflow-hidden bg-[var(--color-background)] p-4 md:p-8 flex items-center justify-center">
          {/* The Graph Paper Canvas */}
          <div 
            className="w-full h-full max-w-5xl max-h-[800px] shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-[#e5e0d8] relative transition-all duration-300"
            style={gridStyle}
          >
            {/* Overlay Info */}
            <div className="absolute bottom-4 right-4 bg-[var(--color-surface)]/80 backdrop-blur-sm border border-[var(--color-outline-variant)] px-3 py-2 font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] flex flex-col items-end gap-1 pointer-events-none">
              <span className="text-[var(--color-primary)]">800 × 600 px</span>
              <span>CELDA: {cellSize}px · MAYOR: c/{majorLine}</span>
            </div>
            
            {/* Center crosshair indicator for drafting aesthetic */}
            <div className="absolute top-1/2 left-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#2e2b28] -translate-y-1/2"></div>
              <div className="absolute left-1/2 top-0 w-[1px] h-full bg-[#2e2b28] -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-3 h-3 border border-[#2e2b28] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
