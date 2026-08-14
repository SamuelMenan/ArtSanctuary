---
title: "Estrategia de Rendimiento 2: Reducción del Bundle de Cliente"
audience: dev
status: implemented
updated: 2026-06-01
---

# Reducción del Bundle de Cliente (Client-Side Optimization)

El peso de JavaScript es el enemigo número uno del **TTI (Time to Interactive)**. En ArtSanctuary, usamos herramientas extremadamente pesadas como `konva` para la edición gráfica. Esta estrategia documenta cómo evitamos que la aplicación sea lenta en su carga inicial.

## 1. Empujar el `'use client'` a las Hojas (Leaf Nodes)
En Next.js, cualquier archivo que declare `'use client'` fuerza a todos sus componentes hijos a incluirse en el paquete de JavaScript que se descarga en el navegador.

**Estrategia Aplicada:**
- Evitamos poner `'use client'` en archivos de diseño amplios (layouts, páginas completas, contenedores de dashboard).
- En lugar de eso, pasamos *Server Components* como `children` hacia los *Client Components*, o reservamos la directiva `'use client'` exclusivamente para el botón o el formulario que realmente necesita interactividad (ej. `LikeButton.tsx`, no `ArtworkCard.tsx`).

## 2. Lazy Loading (Carga Perezosa) de Librerías Pesadas
Nuestro editor de tableros infinitos requiere descargar el motor del canvas. Si incluyéramos esta dependencia estáticamente, todos los usuarios pagarían el "costo" de descargar Konva.js, incluso si solo entraran a ver su perfil de usuario.

**Estrategia Aplicada:**
Utilizamos `next/dynamic` para aislar las pantallas pesadas.

```typescript
import dynamic from 'next/dynamic';

// El motor de BoardStage no se descargará hasta que el componente se monte en pantalla.
const BoardStage = dynamic(() => import('@frontend/features/boards/BoardStage'), {
  ssr: false, // Konva usa el objeto window, por lo que NO puede pre-renderizarse en servidor.
  loading: () => <Spinner text="Cargando el motor gráfico..." />
});
```

### Impacto
- **First Load JS (Initial Chunk):** Reducido dramáticamente. Las dependencias gráficas solo se envían al cliente cuando el usuario abre explícitamente el Tablero o la herramienta de Recorte.
- **Rendimiento SEO:** Las páginas públicas (galerías, perfiles) cargan al instante como HTML estático.
