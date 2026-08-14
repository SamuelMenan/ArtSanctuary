---
title: "Arquitectura de Carpetas Optimizada (Rendimiento y Patrón Servicio)"
audience: dev, ai-agent
status: stable
updated: 2026-08-14
owner: TBD
---

# Estructura de Directorios Optimizada

Este documento define la estructura final de carpetas de **ArtSanctuary** (`src/`). Está diseñada específicamente para maximizar el rendimiento mediante React Server Components (RSC) y mantener el código altamente escalable aplicando Clean Architecture (separación estricta de responsabilidades).

---

## Árbol de Directorios Principal

> ⚠️ **Corregido 2026-08-14.** El árbol anterior colgaba i18n y las utilidades
> compartidas de `src/frontend/shared/` cuando viven en `src/shared/`, ponía
> las herramientas directamente bajo `features/` en vez de `features/tools/`,
> y citaba un `dashboard/page.tsx` que no existe. Este árbol sí se verificó
> contra el repo.

```text
src/
├── app/                        # Capa de Enrutamiento (Next.js)
│   ├── api/                    # 1. Controladores HTTP (REST)
│   │   └── <dominio>/route.ts  # Extraen req/auth y llaman a services
│   ├── dashboard/              # 2. Rutas de la UI
│   │   ├── layout.tsx          # chrome persistente (no se re-monta al navegar)
│   │   ├── template.tsx        # SÍ se re-monta: aporta el fade de entrada
│   │   ├── tools/              # boards, canon, color-mixing, crop, cutout,
│   │   │                       #   gesture, grid, notan
│   │   └── workspaces/[id]/    # expediente, recursos, boards, tools
│   ├── layout.tsx              # Providers + resolución inicial de i18n/tema
│   └── (gallery, explore, profile, settings, login, register, upload, collections)
│                               # page.tsx = re-export fino de su Screen
│
├── backend/                    # Capa de Lógica de Negocio y Datos
│   ├── services/               # 3. SERVICIOS (el núcleo). 9 archivos.
│   ├── models/                 # Esquemas de Mongoose (7, incl. workspaces/carnaval/)
│   ├── auth/                   # NextAuth + requireUser
│   ├── db/                     # conexión Mongoose cacheada
│   ├── http/                   # apiError/apiOk + withErrorHandler
│   ├── upload/                 # avatar + storage (Blob / FS local)
│   └── requestPreferences.ts   # lectura SSR de cookies locale/theme
│
├── frontend/                   # Capa de Presentación (UI)
│   ├── features/               # 4. Dominios funcionales
│   │   ├── tools/              # boards, canon, crop, grid, color-mixing,
│   │   │                       #   gesture, notan + shared/ (kit común)
│   │   ├── workspaces/         # plugins Libre/Carnaval (ver workspaces-plugins.md)
│   │   └── artwork, auth, collections, explore, gallery, home, profile, settings
│   │       └── screens/        # composición de pantalla — la entrada real del feature
│   └── shared/                 # 5. UI compartida
│       ├── layouts/  providers/  ui/  hooks/  motion/
│
└── shared/                     # Código isomórfico (NO opcional)
    ├── i18n/                   # diccionarios es/en + createTranslator
    └── lib/                    # canon, boards, workspaces, image, tools, validation
```

---

## ⚠️ El malentendido más caro: dónde vive el Server Component

Documentado el 2026-08-14 porque invalidaba afirmaciones en 4 diagramas y en
`performance/01` a la vez.

**Los `page.tsx` de `src/app/` NO son los Server Components que cargan datos.**
Son re-exports de una línea:

```ts
// src/app/gallery/page.tsx
export { default } from '@frontend/features/gallery/screens/GalleryScreen'
```

El Server Component real —el que llama a los servicios— vive en
`src/frontend/features/<dominio>/screens/`. **Ningún `page.tsx` importa
`@backend/services`**; los 6 que sí lo hacen son Screens: `GalleryScreen`,
`HomeScreen`, `ProfileScreen`, `ProfileDetailScreen`, `CollectionDetailScreen`,
`SettingsScreen`.

Dos consecuencias que rompen las reglas tal como suelen enunciarse:

1. **`src/frontend` sí importa de `src/backend`, y es correcto.** La frontera
   real que no se cruza es `@backend/models` (0 violaciones), no `@backend/*`.
2. **No todas las lecturas son RSC.** `BoardsListScreen` y `ExploreScreen` son
   `'use client'` y leen por `fetch('/api/...')`. El "0 requests HTTP internos"
   aplica a las 6 Screens de servidor, no a toda la app.

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

### 3. `src/frontend/features/*/screens/` (Server Components)
- **Regla:** Aquí —no en `page.tsx`— viven los componentes que se renderizan en
  servidor y obtienen datos. El `page.tsx` correspondiente es un re-export fino.
- **Prohibido en un Screen de servidor:** hacer `fetch('/api/...')` a rutas
  internas (cascada de red evitable).
- **Rendimiento:** importar la función del servicio (`await getGalleryArtworks()`)
  e inyectar el resultado como props hacia los componentes de cliente.
- **Excepción real y aceptada:** las pantallas cuya interacción es
  client-driven (`BoardsListScreen`, `ExploreScreen`) sí son `'use client'` y
  leen por `fetch`. No es una violación: es que su lectura depende de estado de
  UI (búsqueda, filtros).

### 4. `src/frontend/` (Capa de Cliente y Vistas)
- **Regla:** La interactividad y las librerías pesadas deben estar aisladas.
- **Rendimiento (Client Boundaries):** Usar la directiva `'use client'` lo más profundo posible en el árbol de componentes (hojas). Contenedores genéricos de layout deben ser componentes de servidor.
- **Rendimiento (Lazy Load):** Componentes muy pesados (como `konva` en `boards/` o la IA en `crop/`) deben cargarse dinámicamente usando `next/dynamic` para que no bloqueen la descarga inicial del sitio.

---

## Secuencia de Flujo de Datos (Data Flow)

### Escenario A: Carga Inicial de Página (Velocidad Máxima)

Ejemplo **real** (el anterior citaba boards, que precisamente no funciona así):

1. Usuario entra a `/gallery`.
2. `src/app/gallery/page.tsx` re-exporta `GalleryScreen`.
3. `GalleryScreen` (Server Component, en `frontend/features/gallery/screens/`)
   invoca `getGalleryArtworks(category)` de `backend/services/` **directamente
   en memoria**.
4. Renderiza el HTML y pasa las obras al `ArtworkGrid`.
5. **Resultado:** 0 requests HTTP internos. TTFB mínimo.

Aplica igual a `HomeScreen`, `ProfileScreen`, `ProfileDetailScreen`,
`CollectionDetailScreen` y `SettingsScreen`. **No** aplica a boards: su lista
es `'use client'` y lee por `fetch('/api/boards')`.

### Escenario B: Mutación desde el Cliente (Ej: Crear un nuevo Board)
1. El usuario hace click en "Nuevo Tablero" en el cliente.
2. El componente hace un `fetch('POST', '/api/boards')`.
3. `src/app/api/boards/route.ts` valida al usuario y llama a `createBoard()` de `backend/services/`.
4. El servicio escribe en BD y devuelve el objeto nuevo.
5. El controlador responde con HTTP 200 y JSON.
