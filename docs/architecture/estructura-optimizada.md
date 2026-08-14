---
title: "Arquitectura de Carpetas Optimizada (Rendimiento y Patrón Servicio)"
audience: dev, ai-agent
status: stable
updated: 2026-06-01
owner: TBD
---

# Estructura de Directorios Optimizada

Este documento define la estructura final de carpetas de **ArtSanctuary** (`src/`). Está diseñada específicamente para maximizar el rendimiento mediante React Server Components (RSC) y mantener el código altamente escalable aplicando Clean Architecture (separación estricta de responsabilidades).

---

## Árbol de Directorios Principal

```text
src/
├── app/                        # Capa de Enrutamiento y Controladores (Next.js)
│   ├── api/                    # 1. Controladores HTTP (REST)
│   │   ├── artworks/route.ts   # Wrappers finos que extraen req/auth y llaman a services
│   │   └── boards/route.ts     
│   ├── dashboard/              # 2. Rutas de la UI (Páginas)
│   │   └── page.tsx            # React Server Components (RSC). Llaman a services DIRECTO.
│   └── layout.tsx              # Carga inicial de i18n optimizada y Providers
│
├── backend/                    # Capa de Lógica de Negocio y Datos
│   ├── services/               # 3. SERVICIOS (El núcleo de la aplicación)
│   │   ├── artworks.service.ts # Lógica pura, interactúa con BD, retorna POJOs (.lean())
│   │   └── boards.service.ts   # Prohibido importar tipos de HTTP aquí.
│   ├── models/                 # Esquemas de Mongoose (BD)
│   ├── auth/                   # Lógica de sesión y NextAuth
│   └── http/                   # Utilidades de mapeo de errores globales
│
├── frontend/                   # Capa de Presentación (UI)
│   ├── features/               # 4. Dominios Funcionales (Agrupados por feature)
│   │   ├── boards/             # UI de Tableros (Client Components aislados, lazy loading)
│   │   ├── grid/               # UI de Cuadrícula de Referencia
│   │   ├── crop/               # UI de Herramientas de Recorte
│   │   └── explore/            # UI de Exploración
│   └── shared/                 # 5. Código Compartido de UI
│       ├── i18n/               # Diccionarios de idiomas e inicialización
│       ├── ui/                 # Componentes base (Botones, Modales, Inputs)
│       └── lib/                # Utilidades puras de frontend
│
└── shared/                     # Código Isomórfico (Opcional, utilidades globales)
```

---

## Reglas de Arquitectura por Carpeta (Guardarraíles)

Para mantener el rendimiento y la organización, los agentes y desarrolladores deben respetar las siguientes restricciones por capa:

### 1. `src/backend/services/` (Lógica de Dominio)
- **Regla:** Solo código TypeScript puro.
- **Prohibido:** No se puede importar nada de `next/server` (ni `NextRequest`, ni `NextResponse`). Tampoco hooks de React.
- **Rendimiento:** Deben retornar objetos planos (POJO). Si se usa Mongoose, añadir siempre `.lean()` o parsear el resultado. Los Server Components fallan al serializar clases pesadas de BD.

### 2. `src/app/api/` (Controladores HTTP)
- **Regla:** Máximo ~30 líneas de código por archivo.
- **Prohibido:** No hacer consultas de base de datos directas (`Model.find()`).
- **Flujo:** Extraer token/sesión ➔ Extraer body/params ➔ Invocar función de `backend/services/` ➔ Mapear el retorno a `apiOk()` o `apiError()`.

### 3. `src/app/(rutas)/page.tsx` (Server Components)
- **Regla:** Estas son las páginas que se renderizan en el servidor. Obtienen datos de forma directa y ultrarrápida.
- **Prohibido:** Hacer `fetch('/api/...')` a rutas internas.
- **Rendimiento:** Para obtener datos, deben importar la función del servicio (`await getArtworks()`) e inyectar el resultado como *props* hacia la vista en `frontend/`. Esto elimina las "cascadas de red" (network waterfalls).

### 4. `src/frontend/` (Capa de Cliente y Vistas)
- **Regla:** La interactividad y las librerías pesadas deben estar aisladas.
- **Rendimiento (Client Boundaries):** Usar la directiva `'use client'` lo más profundo posible en el árbol de componentes (hojas). Contenedores genéricos de layout deben ser componentes de servidor.
- **Rendimiento (Lazy Load):** Componentes muy pesados (como `konva` en `boards/` o la IA en `crop/`) deben cargarse dinámicamente usando `next/dynamic` para que no bloqueen la descarga inicial del sitio.

---

## Secuencia de Flujo de Datos (Data Flow)

### Escenario A: Carga Inicial de Página (Velocidad Máxima)
1. Usuario entra a `/dashboard`.
2. `src/app/dashboard/page.tsx` (RSC) inicia en el servidor.
3. El RSC invoca directamente `getUserBoards()` desde `backend/services/`.
4. El RSC renderiza la UI base (HTML pregenerado) y pasa los *boards* al componente interactivo en `frontend/features/boards/`.
5. **Resultado:** 0 requests HTTP internos. TTFB (Time to First Byte) mínimo.

### Escenario B: Mutación desde el Cliente (Ej: Crear un nuevo Board)
1. El usuario hace click en "Nuevo Tablero" en el cliente.
2. El componente hace un `fetch('POST', '/api/boards')`.
3. `src/app/api/boards/route.ts` valida al usuario y llama a `createBoard()` de `backend/services/`.
4. El servicio escribe en BD y devuelve el objeto nuevo.
5. El controlador responde con HTTP 200 y JSON.
