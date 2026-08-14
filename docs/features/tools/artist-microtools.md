---
title: Micro-herramientas de Asistencia Rápida
audience: all
status: deprecated
updated: 2026-06-01
owner: TBD
---

> **NOTA:** Esta documentación está **obsoleta**. Las herramientas han sido refactorizadas y divididas en módulos individuales bajo `src/frontend/features/tools/`.
> Consulta la nueva documentación en:
> - `docs/features/tools/boards.md`
> - `docs/features/tools/grid.md`
> - `docs/features/tools/crop.md`

> **Módulo:** `systems/artist-microtools`  
> **Ubicación en la app:** `/dashboard/tools`  
> **Plan requerido:** Free (herramientas básicas) / Pro (configuración avanzada)

---

## Propósito del Módulo

El artista típico mantiene abiertos entre 5 y 10 tabs externos mientras trabaja: una cuadrícula en un sitio, un temporizador de gesture drawing en otro, una rueda de color en un tercero. Cada cambio de contexto interrumpe el flujo creativo.

**La suite de Micro-herramientas de ArtSanctuary** integra estas utilidades directamente en el dashboard de la plataforma. Son herramientas ligeras, basadas puramente en el navegador (sin servidor, sin guardar datos), que mantienen al artista dentro del ecosistema sin distracciones externas.

---

## Integración en el Dashboard

### Ruta y estructura de páginas

```
pages/
└── dashboard/
    └── tools/
        ├── index.jsx              # Hub principal — grid de acceso a cada herramienta
        ├── graph-paper.jsx        # Lienzo de papel milimetrado
        ├── grid-overlay.jsx       # Cuadrícula sobre imagen de referencia
        ├── notan.jsx              # Simplificador tonal Notan
        ├── color-mixer.jsx        # Simulador de mezcla de colores físicos
        └── gesture-drawing.jsx    # Reproductor de fotos cronometradas
```

### Componentes

```
components/
└── tools/
    ├── ToolsHub.jsx               # Grid de tarjetas de acceso al hub
    ├── ToolCard.jsx               # Tarjeta individual por herramienta
    ├── graph-paper/
    │   └── GraphPaperCanvas.jsx
    ├── grid-overlay/
    │   ├── GridOverlay.jsx
    │   └── GridControls.jsx       # Sliders de columnas, filas, opacidad
    ├── notan/
    │   ├── NotanCanvas.jsx
    │   └── NotanControls.jsx      # Slider de umbral tonal
    ├── color-mixer/
    │   ├── ColorMixerCanvas.jsx
    │   └── PigmentPalette.jsx     # Selección de pigmentos predefinidos
    └── gesture-drawing/
        ├── GesturePlayer.jsx
        ├── GestureTimer.jsx       # Countdown con barra de progreso
        └── GestureControls.jsx    # Duración, pausa, siguiente
```

### Hub de herramientas — `ToolsHub.jsx`

El punto de entrada es una grilla de tarjetas desde `/dashboard/tools`. Cada tarjeta abre la herramienta en modo panel expandido dentro del mismo layout de la plataforma.

```jsx
// components/tools/ToolsHub.jsx
import ToolCard from './ToolCard';

const TOOLS = [
  {
    id:          'graph-paper',
    title:       'Papel Milimetrado',
    description: 'Lienzo de cuadrícula configurable para bocetos proporcionales.',
    icon:        '▦',
    href:        '/dashboard/tools/graph-paper',
    plan:        'free',
  },
  {
    id:          'grid-overlay',
    title:       'Cuadrícula de Referencia',
    description: 'Superpone una cuadrícula sobre cualquier imagen para encuadrar proporciones.',
    icon:        '⊞',
    href:        '/dashboard/tools/grid-overlay',
    plan:        'free',
  },
  {
    id:          'notan',
    title:       'Notan',
    description: 'Reduce una imagen a valores tonales en blanco, negro y gris medio.',
    icon:        '◑',
    href:        '/dashboard/tools/notan',
    plan:        'free',
  },
  {
    id:          'color-mixer',
    title:       'Mezcla de Colores',
    description: 'Simula la mezcla substractiva de pigmentos físicos.',
    icon:        '🎨',
    href:        '/dashboard/tools/color-mixer',
    plan:        'free',
  },
  {
    id:          'gesture-drawing',
    title:       'Gesture Drawing',
    description: 'Sesiones cronometradas de dibujo de figura con fotos de referencia.',
    icon:        '⏱',
    href:        '/dashboard/tools/gesture-drawing',
    plan:        'free',
  },
  {
    id:          'canon-proportions',
    title:       'Canon de Proporciones',
    description: 'Calcula las medidas del cuerpo humano según el canon clásico de 7 cabezas y media.',
    icon:        '◻',
    href:        '/dashboard/tools/canon-proportions',
    plan:        'free',
  },
];

export default function ToolsHub() {
  return (
    <section>
      <h1 className="font-serif text-3xl text-sanctuary-text mb-2">
        Micro-herramientas
      </h1>
      <p className="font-sans text-sanctuary-muted text-sm mb-8">
        Utilidades de asistencia rápida. Todo corre en tu navegador, sin salir de ArtSanctuary.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
```

---

## Herramienta 1 — Lienzo de Papel Milimetrado

### Descripción

Un `<canvas>` interactivo que renderiza una cuadrícula milimetrada configurable. El artista puede ajustar el tamaño de celda, el color de la grilla y exportar el lienzo como PNG para imprimirlo o usarlo como capa de fondo en software externo.

### Props y estado

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `cellSize` | `number` | `20` | Tamaño en px de cada celda |
| `majorEvery` | `number` | `5` | Cada cuántas celdas se dibuja una línea gruesa |
| `color` | `string` | `#2e2b28` | Color de la cuadrícula |
| `bgColor` | `string` | `#faf8f4` | Color de fondo del lienzo |

### Implementación

```jsx
// components/tools/graph-paper/GraphPaperCanvas.jsx
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/ui/Button';

export default function GraphPaperCanvas() {
  const canvasRef = useRef(null);
  const [cellSize,   setCellSize]   = useState(20);
  const [majorEvery, setMajorEvery] = useState(5);
  const [gridColor,  setGridColor]  = useState('#2e2b28');
  const [bgColor,    setBgColor]    = useState('#faf8f4');

  // Dibuja la cuadrícula cada vez que cambia un parámetro
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const { width, height } = canvas;

    // Fondo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    for (let x = 0; x <= width; x += cellSize) {
      const isMajor = (x / cellSize) % majorEvery === 0;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.globalAlpha = isMajor ? 0.6 : 0.2;
      ctx.lineWidth   = isMajor ? 1.5 : 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += cellSize) {
      const isMajor = (y / cellSize) % majorEvery === 0;
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
      ctx.globalAlpha = isMajor ? 0.6 : 0.2;
      ctx.lineWidth   = isMajor ? 1.5 : 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [cellSize, majorEvery, gridColor, bgColor]);

  function handleExport() {
    const link    = document.createElement('a');
    link.download = 'artsanctuary-graph-paper.png';
    link.href     = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controles */}
      <div className="flex flex-wrap gap-4 items-end p-4
                      bg-sanctuary-surface border border-sanctuary-border rounded-card">

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Tamaño de celda: <span className="text-sanctuary-text">{cellSize}px</span>
          <input type="range" min={10} max={60} value={cellSize}
                 onChange={(e) => setCellSize(Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Línea gruesa cada: <span className="text-sanctuary-text">{majorEvery} celdas</span>
          <input type="range" min={2} max={10} value={majorEvery}
                 onChange={(e) => setMajorEvery(Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Color cuadrícula
          <input type="color" value={gridColor}
                 onChange={(e) => setGridColor(e.target.value)}
                 className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent" />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Color fondo
          <input type="color" value={bgColor}
                 onChange={(e) => setBgColor(e.target.value)}
                 className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent" />
        </label>

        <Button variant="ghost" onClick={handleExport}>
          Exportar PNG
        </Button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="rounded-card border border-sanctuary-border w-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}
```

### Especificación UI — Panel Activo (vista dos paneles)

```
CONTROL BAR (#201f1f bg, 1px bottom border #444748):
  [TAMAÑO CELDA  ──●────  20px]   slider min 10 max 60
  [LÍNEA GRUESA CADA  ──●────  5 celdas]   slider min 2 max 10
  [COLOR CUADRÍCULA  ██ ]   color swatch
  [COLOR FONDO  ██ ]   color swatch
  [EXPORTAR PNG]   secondary ghost button, right-aligned
  Todos los labels: JetBrains Mono label-sm ALL CAPS secondary (#c4c7c8)

ÁREA PRINCIPAL (#faf8f4 bg por default, cambia según color fondo):
  Canvas que ocupa todo el espacio disponible.
  Cuadrícula dibujada con líneas finas (#2e2b28 / 20% opacidad)
  y líneas gruesas cada N celdas (#2e2b28 / 60% opacidad).
  Sin bordes adicionales. imageRendering: crisp-edges.
```

---

## Herramienta 2 — Cuadrícula sobre Imagen de Referencia

### Descripción

El artista sube (o pega por URL) una imagen de referencia y sobre ella se superpone una cuadrícula SVG configurable en columnas, filas y opacidad. Útil para la técnica de copiado por cuadrículas y para analizar proporciones compositivas.

### Implementación del componente principal

```jsx
// components/tools/grid-overlay/GridOverlay.jsx
import { useState, useRef } from 'react';

export default function GridOverlay() {
  const [imageUrl, setImageUrl] = useState(null);
  const [cols,     setCols]     = useState(8);
  const [rows,     setRows]     = useState(8);
  const [opacity,  setOpacity]  = useState(0.5);
  const [color,    setColor]    = useState('#c9a96e');
  const containerRef            = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) setImageUrl(URL.createObjectURL(file));
  }

  // Genera las líneas SVG de la cuadrícula como porcentajes
  function buildGridLines() {
    const lines = [];

    // Líneas verticales
    for (let c = 1; c < cols; c++) {
      const x = `${(c / cols) * 100}%`;
      lines.push(<line key={`v${c}`} x1={x} y1="0%" x2={x} y2="100%"
                        stroke={color} strokeWidth="1" />);
    }
    // Líneas horizontales
    for (let r = 1; r < rows; r++) {
      const y = `${(r / rows) * 100}%`;
      lines.push(<line key={`h${r}`} x1="0%" y1={y} x2="100%" y2={y}
                        stroke={color} strokeWidth="1" />);
    }
    return lines;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Carga de imagen */}
      <div className="p-4 bg-sanctuary-surface border border-sanctuary-border rounded-card">
        <label className="block text-xs text-sanctuary-muted font-mono mb-2">
          Seleccionar imagen de referencia
        </label>
        <input type="file" accept="image/*" onChange={handleFileChange}
               className="text-sanctuary-text text-sm" />
      </div>

      {/* Controles de cuadrícula */}
      <div className="flex flex-wrap gap-4 items-end p-4
                      bg-sanctuary-surface border border-sanctuary-border rounded-card">

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Columnas: <span className="text-sanctuary-text">{cols}</span>
          <input type="range" min={2} max={24} value={cols}
                 onChange={(e) => setCols(Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Filas: <span className="text-sanctuary-text">{rows}</span>
          <input type="range" min={2} max={24} value={rows}
                 onChange={(e) => setRows(Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Opacidad: <span className="text-sanctuary-text">{Math.round(opacity * 100)}%</span>
          <input type="range" min={0.1} max={1} step={0.05} value={opacity}
                 onChange={(e) => setOpacity(Number(e.target.value))} />
        </label>

        <label className="flex flex-col gap-1 text-xs text-sanctuary-muted font-mono">
          Color
          <input type="color" value={color}
                 onChange={(e) => setColor(e.target.value)}
                 className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent" />
        </label>
      </div>

      {/* Vista con cuadrícula superpuesta */}
      <div ref={containerRef}
           className="relative rounded-card border border-sanctuary-border overflow-hidden"
           style={{ minHeight: '400px', background: '#141210' }}>

        {imageUrl ? (
          <>
            <img src={imageUrl} alt="Referencia"
                 className="w-full h-full object-contain block" />
            {/* SVG overlay — posicionado sobre la imagen */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {buildGridLines()}
            </svg>
          </>
        ) : (
          <div className="flex items-center justify-center h-64
                          text-sanctuary-muted font-mono text-sm">
            Sube una imagen para comenzar
          </div>
        )}
      </div>
    </div>
  );
}
```

### Especificación UI — Panel Activo (vista dos paneles)

```
CONTROL BAR (#201f1f bg, 1px bottom border #444748):
  [SELECCIONAR IMAGEN]   secondary ghost button — abre file picker
  [COLUMNAS  ──●────  8]   slider
  [FILAS  ──●────  8]   slider
  [OPACIDAD  ──●────  50%]   slider
  [COLOR  ██ ]   color swatch para el color de la cuadrícula
  Todos los labels: JetBrains Mono label-sm ALL CAPS secondary

ÁREA PRINCIPAL (#0e0e0e bg):
  Estado vacío: zona de drop con borde dashed 1px #444748,
    texto "SUBE UNA IMAGEN DE REFERENCIA" + ghost button "SELECCIONAR ARCHIVO"
  Estado con imagen: imagen a pantalla completa (object-contain)
    con SVG de líneas blancas superpuesto (pointer-events-none)
    formando la cuadrícula N×M en opacidad configurable.
```

---

## Herramienta 3 — Notan (Simplificador Tonal)

### Descripción

Carga una imagen y aplica un filtro de umbral (*threshold*) usando `CanvasRenderingContext2D`. El resultado reduce la imagen a **blanco**, **negro** y, opcionalmente, un **gris medio**, permitiendo al artista analizar la estructura de masas de luz y sombra antes de dibujar.

### Lógica principal

```jsx
// components/tools/notan/NotanCanvas.jsx — lógica del filtro
function applyNotan(canvas, sourceImage, threshold, useMidtone) {
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data      = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Luminosidad perceptual (fórmula Rec. 709)
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

    let value;
    if (useMidtone) {
      // Tres zonas: sombra / gris medio / luz
      const midLow  = threshold * 0.6;
      const midHigh = threshold;
      if      (luma < midLow)  value = 0;
      else if (luma < midHigh) value = 128;
      else                     value = 255;
    } else {
      // Solo blanco y negro
      value = luma < threshold ? 0 : 255;
    }

    data[i] = data[i + 1] = data[i + 2] = value;
    // data[i + 3] = alpha — no se modifica
  }

  ctx.putImageData(imageData, 0, 0);
}
```

**Parámetros configurables:**

| Parámetro | Rango | Descripción |
|-----------|-------|-------------|
| `threshold` | `0 – 255` | Punto de corte entre sombra y luz |
| `useMidtone` | `boolean` | Activa una zona de gris intermedio |

### Especificación UI — Panel Activo (vista dos paneles)

```
CONTROL BAR (#201f1f bg, 1px bottom border #444748):
  [SELECCIONAR IMAGEN]   secondary ghost button
  [UMBRAL  ──●────  128]   slider 0–255
  [TONO MEDIO  ◻ ]   checkbox toggle — activa zona gris intermedio
  Todos los labels: JetBrains Mono label-sm ALL CAPS secondary

ÁREA PRINCIPAL (#0e0e0e bg, dos columnas side-by-side):
  Columna izquierda — "ORIGINAL" label-sm ALL CAPS: imagen fuente
  Columna derecha  — "NOTAN"    label-sm ALL CAPS: imagen procesada en B&N
  Separadas por 1px línea #444748.
  Debajo de cada canvas: badge pequeño indicando el modo activo
  ("2 VALORES" o "3 VALORES") en JetBrains Mono #484949 bg rounded-full.
```

---

## Herramienta 4 — Simulador de Mezcla de Colores Físicos

### Descripción

Simula la mezcla **substractiva** de pigmentos (como ocurre con pintura real, no con luz RGB). El artista selecciona dos o más colores de una paleta de pigmentos predefinidos y ve el resultado aproximado de mezclarlos.

### Modelo de mezcla substractiva simplificada

La mezcla de pigmentos se aproxima trabajando en el espacio **RYB** (Rojo-Amarillo-Azul) y convirtiendo de vuelta a RGB para visualización. Para la demo se usa una aproximación práctica: la media aritmética de los componentes en modo multiplicación.

```jsx
// lib/colorMixer.js

/**
 * Mezcla dos colores en modo substractivo (multiplicación normalizada).
 * @param {[number, number, number]} c1 — RGB de 0 a 255
 * @param {[number, number, number]} c2 — RGB de 0 a 255
 * @param {number} ratio — peso de c1 (0.0 a 1.0). c2 tiene peso (1 - ratio).
 * @returns {[number, number, number]} — Color resultante en RGB
 */
export function mixSubtractive(c1, c2, ratio = 0.5) {
  return [
    Math.round(((c1[0] / 255) * (c2[0] / 255)) * 255 * ratio
      + ((c1[0] + c2[0]) / 2) * (1 - ratio)),
    Math.round(((c1[1] / 255) * (c2[1] / 255)) * 255 * ratio
      + ((c1[1] + c2[1]) / 2) * (1 - ratio)),
    Math.round(((c1[2] / 255) * (c2[2] / 255)) * 255 * ratio
      + ((c1[2] + c2[2]) / 2) * (1 - ratio)),
  ];
}

// Paleta de pigmentos de referencia (valores RGB aproximados)
export const PIGMENTS = [
  { name: 'Blanco titanio',   rgb: [255, 252, 240] },
  { name: 'Negro marfil',     rgb: [28,  24,  20]  },
  { name: 'Rojo cadmio',      rgb: [210, 40,  30]  },
  { name: 'Amarillo cadmio',  rgb: [255, 200, 10]  },
  { name: 'Azul ultramar',    rgb: [25,  50,  160] },
  { name: 'Tierra sombra',    rgb: [90,  55,  30]  },
  { name: 'Ocre amarillo',    rgb: [200, 155, 60]  },
  { name: 'Verde viridian',   rgb: [50,  130, 100] },
  { name: 'Carmín alizarina', rgb: [155, 20,  60]  },
];
```

### Especificación UI — Panel Activo (vista dos paneles)

```
CONTROL BAR (#201f1f bg, 1px bottom border #444748):
  [PIGMENTO A  ██████ ]   swatch desplegable con paleta de 9 pigmentos
  [PIGMENTO B  ██████ ]   swatch desplegable
  [PROPORCIÓN A  ──●────  50%]   slider de ratio A:B
  Todos los labels: JetBrains Mono label-sm ALL CAPS secondary

ÁREA PRINCIPAL (#0e0e0e bg, tres columnas centradas):
  [PIGMENTO A]  grande cuadrado color sólido + nombre pigmento
       +
  [PIGMENTO B]  grande cuadrado color sólido + nombre pigmento
       =
  [RESULTADO]   cuadrado grande con el color resultante calculado
                código HEX del resultado en JetBrains Mono label-sm blanco
  Flechas "→" entre columnas en secondary color.
  Debajo: paleta de 9 pigmentos disponibles como swatches clickeables
  en fila, con nombre en label-sm ALL CAPS al hacer hover.
```

---

## Herramienta 5 — Gesture Drawing (Reproductor Cronometrado)

### Descripción

Muestra fotos de referencia (figura humana, manos, animales, objetos) en intervalos de tiempo configurables. Al terminar el tiempo, pasa automáticamente a la siguiente imagen. El artista practica el dibujo de gesto sin gestionar manualmente el flujo de imágenes.

### Estado y lógica del reproductor

```jsx
// components/tools/gesture-drawing/GesturePlayer.jsx
import { useState, useEffect, useCallback } from 'react';
import GestureTimer from './GestureTimer';

export default function GesturePlayer({ images, duration = 30 }) {
  const [index,     setIndex]     = useState(0);
  const [timeLeft,  setTimeLeft]  = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);

  const next = useCallback(() => {
    setIndex((prev) => (prev + 1) % images.length);
    setTimeLeft(duration);
  }, [images.length, duration]);

  // Tick del temporizador
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { next(); return duration; }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isRunning, isPaused, next, duration]);

  if (!images.length) {
    return (
      <p className="text-sanctuary-muted font-mono text-sm">
        No hay imágenes de referencia cargadas.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Imagen de referencia */}
      <div className="relative w-full max-w-2xl rounded-card overflow-hidden
                      border border-sanctuary-border bg-sanctuary-surface">
        <img
          src={images[index]}
          alt={`Referencia ${index + 1}`}
          className="w-full object-contain max-h-[60vh]"
        />
      </div>

      {/* Temporizador */}
      <GestureTimer timeLeft={timeLeft} duration={duration} />

      {/* Controles */}
      <div className="flex gap-3">
        {!isRunning ? (
          <button onClick={() => setIsRunning(true)}
                  className="px-6 py-2 rounded-lg bg-sanctuary-accent
                             text-sanctuary-bg font-sans text-sm font-medium
                             hover:bg-sanctuary-accent-hover transition-colors">
            Iniciar sesión
          </button>
        ) : (
          <>
            <button onClick={() => setIsPaused((p) => !p)}
                    className="px-4 py-2 rounded-lg border border-sanctuary-border
                               text-sanctuary-text font-sans text-sm
                               hover:border-sanctuary-accent transition-colors">
              {isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            <button onClick={next}
                    className="px-4 py-2 rounded-lg border border-sanctuary-border
                               text-sanctuary-text font-sans text-sm
                               hover:border-sanctuary-accent transition-colors">
              Siguiente →
            </button>
            <button onClick={() => { setIsRunning(false); setIndex(0); setTimeLeft(duration); }}
                    className="px-4 py-2 rounded-lg border border-red-800
                               text-red-400 font-sans text-sm
                               hover:bg-red-900/30 transition-colors">
              Detener
            </button>
          </>
        )}
      </div>

      {/* Progreso */}
      <p className="font-mono text-sanctuary-muted text-xs">
        Imagen {index + 1} / {images.length}
      </p>
    </div>
  );
}
```

```jsx
// components/tools/gesture-drawing/GestureTimer.jsx
export default function GestureTimer({ timeLeft, duration }) {
  const progress = (timeLeft / duration) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="w-full max-w-2xl flex flex-col gap-2">
      {/* Número */}
      <p className={`text-center font-mono text-4xl font-bold transition-colors
                     ${isUrgent ? 'text-red-400' : 'text-sanctuary-accent'}`}>
        {timeLeft}s
      </p>
      {/* Barra de progreso */}
      <div className="w-full h-1.5 bg-sanctuary-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000
                      ${isUrgent ? 'bg-red-500' : 'bg-sanctuary-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
```

### Especificación UI — Panel Activo (vista dos paneles)

```
CONTROL BAR (#201f1f bg, 1px bottom border #444748):
  [DURACIÓN  ──●────  30s]   slider 15s / 30s / 45s / 60s / 90s / 120s
  [CATEGORÍA  Figura humana ▾]   dropdown: Figura humana / Manos / Animales
  Todos los labels: JetBrains Mono label-sm ALL CAPS secondary

ÁREA PRINCIPAL (#0e0e0e bg):
  Estado pausado (antes de iniciar):
    Imagen de referencia a pantalla completa (object-contain)
    Overlay central semitransparente con botón primario blanco "INICIAR SESIÓN"

  Estado activo:
    Imagen de referencia ocupa ~80% del alto
    Barra de progreso horizontal (1px, blanca, ancho = % tiempo restante)
    directamente bajo la imagen
    Número de tiempo restante grande centrado (Manrope 700, 48px, blanco)
      → últimos 5s: color #ffb4ab (error color)
    Fila de botones debajo: [PAUSAR] [SIGUIENTE →] [DETENER]
      ghost secondary style, JetBrains Mono label-sm ALL CAPS
    Contador pie: "IMAGEN 1 / 12" JetBrains Mono label-sm secondary
```

---

## Herramienta 6 — Canon de 7 Cabezas y Media

### Descripción

El artista ingresa la **altura total** del cuerpo que desea dibujar o esculpir (en cm, px o cualquier unidad de trabajo) y la herramienta renderiza un **diagrama de silueta humana** dividido en 7.5 unidades de cabeza según el canon clásico de Lisipo. Cada segmento corporal se etiqueta automáticamente con su medida calculada.

El canon de 7 cabezas y media es la norma de proporciones clásica para representar el cuerpo humano promedio (realista), a diferencia del canon heroico de 8 cabezas usado en escultura idealizada.

### Distribución de proporciones (canon de 7.5 cabezas)

| Segmento | Cabezas | Descripción |
|----------|---------|-------------|
| Cabeza | 1.0 | Desde el vértice hasta el mentón |
| Cuello + hombros | 0.5 | Zona cervical |
| Tórax (pecho) | 1.0 | Desde hombros hasta la base del pecho |
| Abdomen | 1.0 | Desde pecho hasta ombligo |
| Pelvis | 1.0 | Desde ombligo hasta entrepierna |
| Muslo | 1.5 | Desde cadera hasta la rodilla |
| Pierna baja + pie | 1.5 | Desde rodilla hasta el suelo |
| **Total** | **7.5** | |

### Props y estado

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `totalHeight` | `number` | `175` | Altura total del cuerpo en la unidad elegida |
| `unit` | `'cm' \| 'px' \| 'in'` | `'cm'` | Unidad de medida |
| `showLabels` | `boolean` | `true` | Muestra las etiquetas numéricas en cada segmento |
| `showGuideLines` | `boolean` | `true` | Líneas horizontales de separación entre segmentos |

### Lógica principal

```js
// lib/canonProportions.js

const CANON_RATIOS = [
  { segment: 'Cabeza',           ratio: 1.0 / 7.5 },
  { segment: 'Cuello',           ratio: 0.5 / 7.5 },
  { segment: 'Tórax',            ratio: 1.0 / 7.5 },
  { segment: 'Abdomen',          ratio: 1.0 / 7.5 },
  { segment: 'Pelvis',           ratio: 1.0 / 7.5 },
  { segment: 'Muslo',            ratio: 1.5 / 7.5 },
  { segment: 'Pierna baja + pie',ratio: 1.5 / 7.5 },
];

/**
 * Calcula las medidas reales de cada segmento dado un total.
 * @param {number} totalHeight - Altura total del cuerpo
 * @param {'cm'|'px'|'in'} unit - Unidad de medida
 * @returns {{ segment: string, value: number, unit: string }[]}
 */
export function calculateCanon(totalHeight, unit = 'cm') {
  const headSize = totalHeight / 7.5;
  return CANON_RATIOS.map(({ segment, ratio }) => ({
    segment,
    value: Math.round(totalHeight * ratio * 10) / 10,
    headUnits: ratio * 7.5,
    unit,
  }));
}
```

### Implementación del componente

```jsx
// components/tools/canon/CanonCanvas.jsx
import { useRef, useEffect, useState } from 'react';
import { calculateCanon, CANON_RATIOS } from '@/lib/canonProportions';

export default function CanonCanvas() {
  const canvasRef  = useRef(null);
  const [height,   setHeight]   = useState(175);
  const [unit,     setUnit]     = useState('cm');
  const [labels,   setLabels]   = useState(true);
  const [guides,   setGuides]   = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const segments = calculateCanon(height, unit);

    ctx.clearRect(0, 0, W, H);

    // Fondo
    ctx.fillStyle = '#0e0e0e';
    ctx.fillRect(0, 0, W, H);

    // Silueta — rectángulos proporcionales centrados
    const figureW = W * 0.25;
    const figureX = (W - figureW) / 2;
    let currentY  = 20;

    segments.forEach(({ segment, ratio, value }, i) => {
      const segH = (H - 40) * (CANON_RATIOS[i].ratio);

      // Relleno del segmento
      ctx.fillStyle = i % 2 === 0 ? '#353534' : '#2a2a2a';
      ctx.fillRect(figureX, currentY, figureW, segH);

      // Línea guía
      if (guides) {
        ctx.strokeStyle = '#8e9192';
        ctx.lineWidth   = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, currentY);
        ctx.lineTo(W, currentY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Etiqueta izquierda — nombre segmento
      if (labels) {
        ctx.fillStyle = '#c4c7c8';
        ctx.font      = '11px JetBrains Mono';
        ctx.fillText(segment.toUpperCase(), 16, currentY + segH / 2 + 4);

        // Etiqueta derecha — medida calculada
        const label = `${value} ${unit}`;
        const tw    = ctx.measureText(label).width;
        ctx.fillStyle = '#e5e2e1';
        ctx.fillText(label, W - tw - 16, currentY + segH / 2 + 4);
      }

      currentY += segH;
    });

  }, [height, unit, labels, guides]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controles */}
      <div className="flex flex-wrap gap-6 items-end px-4 py-3
                      bg-[#201f1f] border-b border-[#444748]">

        <label className="flex flex-col gap-1 text-xs font-mono text-[#c4c7c8] tracking-widest uppercase">
          Altura total
          <div className="flex items-center gap-2">
            <input
              type="number" min={50} max={300} value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-20 px-2 py-1 rounded bg-[#131313] border border-[#444748]
                         text-[#e5e2e1] font-mono text-sm focus:outline-none focus:border-[#8e9192]"
            />
            <select
              value={unit} onChange={(e) => setUnit(e.target.value)}
              className="px-2 py-1 rounded bg-[#131313] border border-[#444748]
                         text-[#c4c7c8] font-mono text-xs focus:outline-none"
            >
              <option value="cm">cm</option>
              <option value="px">px</option>
              <option value="in">in</option>
            </select>
          </div>
        </label>

        <label className="flex items-center gap-2 text-xs font-mono text-[#c4c7c8] tracking-widest uppercase cursor-pointer">
          <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} />
          Etiquetas
        </label>

        <label className="flex items-center gap-2 text-xs font-mono text-[#c4c7c8] tracking-widest uppercase cursor-pointer">
          <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
          Guías
        </label>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full rounded"
        style={{ background: '#0e0e0e', imageRendering: 'crisp-edges' }}
      />
    </div>
  );
}
```

### Tabla de medidas generada (ejemplo: 175 cm)

| Segmento | Cabezas | Medida (175 cm) |
|----------|---------|-----------------|
| Cabeza | 1.0 | 23.3 cm |
| Cuello | 0.5 | 11.7 cm |
| Tórax | 1.0 | 23.3 cm |
| Abdomen | 1.0 | 23.3 cm |
| Pelvis | 1.0 | 23.3 cm |
| Muslo | 1.5 | 35.0 cm |
| Pierna baja + pie | 1.5 | 35.0 cm |
| **Total** | **7.5** | **175.0 cm** |

---

## Consideraciones Técnicas Comunes

| Aspecto | Decisión |
|---------|----------|
| **Procesamiento** | Todo ocurre en el cliente (Canvas API, SVG). Cero llamadas al servidor. |
| **Persistencia** | Las herramientas no guardan estado. Son sesiones efímeras. |
| **Imágenes de Gesture Drawing** | La demo usa un set de fotos CC0 incluido en `/public/gesture-refs/`. En Pro se puede cargar un set propio. |
| **Exportación** | `canvas.toDataURL()` para PNG. Sin dependencias externas. |
| **Responsividad** | Los `canvas` usan `width: 100%` en CSS; el tamaño interno se fija en el atributo HTML para mantener la resolución. |

---

## Plan de Acceso por Tier

| Herramienta | Free | Pro |
|-------------|:----:|:---:|
| Papel milimetrado | ✅ | ✅ + exportación en alta resolución |
| Cuadrícula sobre imagen | ✅ | ✅ + exportación de imagen con cuadrícula |
| Notan | ✅ | ✅ + modo 4 tonos (sombra / oscuro / claro / luz) |
| Mezcla de colores | ✅ (8 pigmentos) | ✅ + paleta personalizable |
| Gesture Drawing | ✅ (set CC0 incluido) | ✅ + carga de sets de referencia propios |
| Canon de 7 cabezas y media | ✅ (cm / px / in) | ✅ + canon heroico 8 cabezas + exportación PNG |

---

## Navegación de la Documentación

- **[← Frontend: React & Tailwind](../frontend_react_tailwind.md)** — Convenciones de componentes y Tailwind.
- **[← Backend & Base de Datos](../backend_y_database.md)** — API y modelos de datos.
- **[← README](../README.md)** — Instalación y ejecución local.

---

*ArtSanctuary Demo v0.1.0 — Suite de Micro-herramientas de Asistencia Rápida.*
