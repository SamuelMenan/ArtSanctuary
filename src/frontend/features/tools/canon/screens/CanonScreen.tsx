'use client'

import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'
import { useState } from 'react'

export default function CanonPage() {
  const [height, setHeight] = useState(175)
  const [showLabels, setShowLabels] = useState(true)
  const [showGuides, setShowGuides] = useState(true)

  const headHeight = height / 7.5

  return (
    <AppShell>
      <ToolActiveLayout>
        {/* Top Control Bar */}
        <div className="h-16 bg-[var(--color-surface-container)] border-b border-[var(--color-outline-variant)] flex flex-wrap items-center justify-between px-6 shrink-0 overflow-x-auto gap-4">
          <div className="flex items-center gap-6">
            {/* Height Input */}
            <div className="flex items-center gap-2">
              <label className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase tracking-wider whitespace-nowrap" htmlFor="height-input">ALTURA TOTAL</label>
              <div className="flex items-center bg-[var(--color-surface-dim)] border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] px-2 py-1">
                <input 
                  className="bg-transparent border-none text-[var(--color-primary)] font-mono text-[var(--text-label-sm)] p-0 w-12 text-center focus:ring-0 appearance-none" 
                  id="height-input" 
                  type="number" 
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
                <span className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] ml-1 mr-2">cm</span>
              </div>
            </div>
            
            {/* Toggles */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 border ${showLabels ? 'border-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] group-hover:border-[var(--color-primary)]'} rounded-sm flex items-center justify-center transition-colors`}>
                {showLabels && <div className="w-2 h-2 bg-[var(--color-primary)] rounded-sm"></div>}
              </div>
              <input type="checkbox" className="hidden" checked={showLabels} onChange={() => setShowLabels(!showLabels)} />
              <span className={`font-mono text-[var(--text-label-sm)] ${showLabels ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'} transition-colors uppercase tracking-wider`}>ETIQUETAS</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-4 h-4 border ${showGuides ? 'border-[var(--color-primary)]' : 'border-[var(--color-outline-variant)] group-hover:border-[var(--color-primary)]'} rounded-sm flex items-center justify-center transition-colors`}>
                {showGuides && <div className="w-2 h-2 bg-[var(--color-primary)] rounded-sm"></div>}
              </div>
              <input type="checkbox" className="hidden" checked={showGuides} onChange={() => setShowGuides(!showGuides)} />
              <span className={`font-mono text-[var(--text-label-sm)] ${showGuides ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)] group-hover:text-[var(--color-primary)]'} transition-colors uppercase tracking-wider`}>GUÍAS</span>
            </label>
          </div>
          
          {/* Export Button */}
          <button className="px-4 py-2 border border-[var(--color-outline-variant)] rounded-[var(--radius-sm)] font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all uppercase tracking-wider bg-transparent flex items-center gap-2 whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">download</span>
            EXPORTAR PNG
          </button>
        </div>
        
        {/* Main Canvas Area */}
        <div className="flex-grow relative overflow-y-auto flex justify-center p-8 bg-[var(--color-surface-container-lowest)] min-h-[600px]">
          {/* Proportion Container */}
          <div className="relative w-full max-w-3xl min-h-[500px] flex opacity-90 transition-opacity duration-300 hover:opacity-100">
            
            {/* Left Labels */}
            {showLabels && (
              <div className="w-24 md:w-32 h-full flex flex-col justify-between absolute left-0 top-0 bottom-0 py-4 pointer-events-none z-10 hidden sm:flex">
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '6.66%' }}>CABEZA</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '20%' }}>TÓRAX</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '33.33%' }}>ABDOMEN</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '46.66%' }}>PELVIS</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '60%' }}>MUSLO</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '80%' }}>PIERNA</div>
                <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-on-surface-variant)] uppercase text-right pr-4 tracking-wider absolute" style={{ top: '93.33%' }}>PIES</div>
              </div>
            )}
            
            {/* Center Graphic & Guidelines */}
            <div className="flex-grow relative h-full flex justify-center sm:ml-32 sm:mr-48 border-x border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-dim)]">
              {/* Horizontal Grid Lines */}
              {showGuides && (
                <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '0%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '13.33%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '26.66%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '40%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '53.33%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '66.66%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '80%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '93.33%' }}></div>
                  <div className="absolute w-full border-t border-dashed border-[var(--color-outline-variant)]/60" style={{ top: '100%' }}></div>
                </div>
              )}
              
              {/* Anatómica & Proporcional Silhouette (SVG) */}
              <div className="h-full w-full max-w-[200px] relative z-10 flex flex-col items-center">
                <svg viewBox="0 0 200 750" preserveAspectRatio="none" className="w-full h-full drop-shadow-sm">
                  {/* Arms (Behind torso) */}
                  <path d="M40 120 L15 160 L25 300 L35 450 L50 450 L45 300 L60 200 Z" className="fill-[var(--color-surface-container)] stroke-[var(--color-surface-bright)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                  <path d="M160 120 L185 160 L175 300 L165 450 L150 450 L155 300 L140 200 Z" className="fill-[var(--color-surface-container)] stroke-[var(--color-surface-bright)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />

                  {/* 1. Cabeza (0 - 13.33%) */}
                  <g className="group cursor-crosshair">
                    <path d="M100 0 C130 0 135 40 135 60 C135 85 115 100 100 100 C85 100 65 85 65 60 C65 40 70 0 100 0 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="55" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.0</text>
                  </g>

                  {/* 2. Tórax (13.33% - 26.66%) */}
                  <g className="group cursor-crosshair">
                    <path d="M100 100 C110 100 115 110 115 120 L160 120 C175 120 180 140 170 160 C160 180 150 200 140 200 L60 200 C50 200 40 180 30 160 C20 140 25 120 40 120 L85 120 C85 110 90 100 100 100 Z" className="fill-[var(--color-surface-container-high)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-variant)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="155" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.0</text>
                  </g>

                  {/* 3. Abdomen (26.66% - 40%) */}
                  <g className="group cursor-crosshair">
                    <path d="M60 200 L140 200 L135 250 L145 300 L55 300 L65 250 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="255" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.0</text>
                  </g>

                  {/* 4. Pelvis (40% - 53.33%) */}
                  <g className="group cursor-crosshair">
                    <path d="M55 300 L145 300 L160 360 L100 400 L40 360 Z" className="fill-[var(--color-surface-container-high)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-variant)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="340" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.0</text>
                  </g>

                  {/* 5. Muslo (53.33% - 73.33%) */}
                  <g className="group cursor-crosshair">
                    <path d="M40 360 L100 400 L90 550 L55 550 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <path d="M100 400 L160 360 L145 550 L110 550 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="480" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.5</text>
                  </g>

                  {/* 6. Pierna (73.33% - 93.33%) */}
                  <g className="group cursor-crosshair">
                    <path d="M55 550 L90 550 L85 700 L60 700 Z" className="fill-[var(--color-surface-container-high)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-variant)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <path d="M110 550 L145 550 L140 700 L115 700 Z" className="fill-[var(--color-surface-container-high)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-variant)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="630" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">1.5</text>
                  </g>

                  {/* 7. Pies (93.33% - 100%) */}
                  <g className="group cursor-crosshair">
                    <path d="M60 700 L85 700 L95 750 L45 750 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <path d="M115 700 L140 700 L155 750 L105 750 Z" className="fill-[var(--color-surface-variant)] stroke-[var(--color-surface-bright)] transition-colors group-hover:fill-[var(--color-surface-container-high)]" vectorEffect="non-scaling-stroke" strokeWidth="2" />
                    <text x="100" y="730" textAnchor="middle" alignmentBaseline="middle" className="font-mono text-[14px] fill-[var(--color-on-surface-variant)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">0.5</text>
                  </g>
                </svg>
              </div>
            </div>
            
            {/* Right Measurements & Scale */}
            {showLabels && (
              <div className="w-24 md:w-48 h-full absolute right-0 top-0 bottom-0 pointer-events-none z-10 hidden sm:flex">
                <div className="w-24 h-full relative flex flex-col justify-between py-4">
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '6.66%' }}>{headHeight.toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '20%' }}>{headHeight.toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '33.33%' }}>{headHeight.toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '46.66%' }}>{headHeight.toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '60%' }}>{(headHeight * 1.5).toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '80%' }}>{(headHeight * 1.5).toFixed(1)} CM</div>
                  <div className="font-mono text-[var(--text-label-sm)] text-[var(--color-primary)] uppercase pl-4 absolute" style={{ top: '93.33%' }}>{(headHeight * 0.5).toFixed(1)} CM</div>
                </div>
                
                <div className="w-24 h-full relative border-l border-[var(--color-outline-variant)]/30 flex items-center hidden md:flex">
                  <div className="absolute left-0 w-full flex items-center" style={{ top: '6.66%' }}>
                    <div className="w-2 border-t border-[var(--color-primary)]"></div>
                    <div className="font-mono text-[10px] text-[var(--color-on-surface-variant)] ml-2 tracking-widest whitespace-nowrap -rotate-90 origin-left translate-y-8 translate-x-2">
                      1 CABEZA = {headHeight.toFixed(1)} CM
                    </div>
                  </div>
                  <div className="absolute left-0 w-1 border-t border-[var(--color-outline-variant)]/50" style={{ top: '10%' }}></div>
                  <div className="absolute left-0 w-2 border-t border-[var(--color-outline-variant)]/80" style={{ top: '13.33%' }}></div>
                  <div className="absolute left-0 w-1 border-t border-[var(--color-outline-variant)]/50" style={{ top: '16.66%' }}></div>
                  <div className="absolute left-0 w-2 border-t border-[var(--color-outline-variant)]/80" style={{ top: '20%' }}></div>
                </div>
              </div>
            )}
            
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="h-8 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] flex items-center px-6 justify-between shrink-0 overflow-x-auto whitespace-nowrap gap-4">
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">SISTEMA: 7.5 CABEZAS (LUMIÈRE)</span>
          <span className="font-mono text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest">UNIDAD BASE: {headHeight.toFixed(2)} CM</span>
        </div>
      </ToolActiveLayout>
    </AppShell>
  )
}
