---
title: "Arquitectura Macro (Capas del Sistema)"
audience: dev
status: stable
updated: 2026-08-14
---

# Arquitectura Macro (Capas del Sistema)


Una vista a alto nivel (10,000 pies de altura) que ilustra la arquitectura de Clean Architecture (Patrón Controlador-Servicio) aplicada en ArtSanctuary.

## Explicación del Diagrama

El sistema está fraccionado en 4 áreas:

1. **Capa Cliente (Navegador):** Componentes con `'use client'`. Disparan
   `fetch` HTTP hacia la API — para **mutar y también para leer** (boards,
   explore, notifications y búsqueda leen así).
2. **Capa Enrutamiento (`src/app/`):** la frontera externa del servidor.
   - Los `page.tsx` son **re-exports de una línea**, no contienen lógica.
   - Los **controladores** (`route.ts`) validan sesión con `requireUser()` y
     delegan en los servicios.
3. **Capa Presentación (`src/frontend/features/*/screens/`):** aquí viven los
   **Server Components reales**, los que invocan servicios en memoria y evitan
   el salto HTTP interno. Ver
   [`../estructura-optimizada.md`](../estructura-optimizada.md#️-el-malentendido-más-caro-dónde-vive-el-server-component).
4. **Capa Lógica (`src/backend/`):** los servicios orquestan y hablan con los
   modelos. **No conocen HTTP ni auth**: es al revés — `requireUser()` se llama
   desde el controlador, antes de invocar al servicio.

## Diagrama (Mermaid)

```mermaid
graph TB
    subgraph Cliente ["Capa Cliente"]
        Browser["Navegador del Usuario"]
        CC["Client Components<br/>'use client'"]
    end

    subgraph Enrutamiento ["Capa Enrutamiento (src/app/)"]
        PAGE["page.tsx<br/><i>re-export de 1 línea</i>"]
        API["Controladores HTTP<br/>route.ts"]
    end

    subgraph Presentacion ["Capa Presentación (src/frontend/)"]
        RSC["Server Components<br/>features/*/screens/"]
    end

    subgraph Logica ["Capa Lógica (src/backend/)"]
        SVC["Servicios Puros<br/>services/"]
        Auth["requireUser / NextAuth<br/>auth/"]
        MOD["Modelos Mongoose<br/>models/"]
    end

    Browser -->|"Petición de Página"| PAGE;
    PAGE -->|"re-exporta"| RSC;
    Browser -->|"Mutación (Fetch)"| API;
    CC -->|"Mutación y LECTURA (Fetch)"| API;
    
    RSC -->|"Llamada Directa en Memoria"| SVC;
    API -->|"Valida sesión"| Auth;
    API -->|"Llama"| SVC;
    
    Auth --> MOD;
    SVC --> MOD;
    MOD --> MongoDB[("Base de Datos")];

    classDef client fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a;
    classDef route fill:#fef3c7,stroke:#d97706,color:#92400e;
    classDef screen fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6;
    classDef logic fill:#dcfce7,stroke:#22c55e,color:#166534;

    class Browser,CC client;
    class PAGE,API route;
    class RSC screen;
    class SVC,Auth,MOD logic;
```
