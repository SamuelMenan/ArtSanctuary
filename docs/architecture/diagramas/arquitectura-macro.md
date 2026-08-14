---
title: "Arquitectura Macro (Capas del Sistema)"
audience: dev
status: stable
updated: 2026-06-01
---

# Arquitectura Macro (Capas del Sistema)

Una vista a alto nivel (10,000 pies de altura) que ilustra la arquitectura de Clean Architecture (Patrón Controlador-Servicio) aplicada en ArtSanctuary.

## Explicación del Diagrama

El sistema está fraccionado en 3 grandes áreas físicas y conceptuales:

1. **Capa Cliente (Navegador):** Componentes marcados con `'use client'`. Estos componentes son los únicos que disparan mutaciones de datos mediante peticiones `fetch` HTTP a través de la red hacia la API.
2. **Capa Enrutamiento (`src/app/`):** Es la frontera externa del servidor. 
   - Los **Server Components** (`page.tsx`) generan HTML inicial. Para leer datos, invocan a los servicios puramente en memoria, siendo sumamente rápidos.
   - Los **Controladores HTTP** (`route.ts`) interceptan tráfico del cliente, extraen credenciales, y delegan en los servicios.
3. **Capa Lógica (`src/backend/`):** El corazón de la aplicación.
   - Los **Servicios** se encargan de orquestar operaciones complejas, validaciones y comunicarse con los Modelos de base de datos (`Mongoose`) o servicios de Autenticación (`NextAuth`). Nunca ven nada de HTTP, asegurando un diseño puro y testeable.

## Diagrama (Mermaid)

```mermaid
graph TB
    subgraph Cliente ["Capa Cliente"]
        Browser["Navegador del Usuario"]
        CC["Client Components<br/>'use client'"]
    end

    subgraph Enrutamiento ["Capa Enrutamiento (src/app/)"]
        RSC["Server Components<br/>page.tsx"]
        API["Controladores HTTP<br/>route.ts"]
    end

    subgraph Logica ["Capa Lógica (src/backend/)"]
        SVC["Servicios Puros<br/>services/"]
        Auth["NextAuth / Sesión<br/>auth/"]
        MOD["Modelos Mongoose<br/>models/"]
    end

    Browser -->|"Petición de Página"| RSC;
    Browser -->|"Mutación (Fetch)"| API;
    CC -->|"Mutación (Fetch)"| API;
    
    RSC -->|"Llamada Directa en Memoria"| SVC;
    API -->|"Validación y Llamada"| SVC;
    
    SVC --> Auth;
    SVC --> MOD;
    MOD --> MongoDB[("Base de Datos")];

    classDef client fill:#dbeafe,stroke:#3b82f6,color:#1e3a8a;
    classDef route fill:#fef3c7,stroke:#d97706,color:#92400e;
    classDef logic fill:#dcfce7,stroke:#22c55e,color:#166534;
    
    class Browser,CC client;
    class RSC,API route;
    class SVC,Auth,MOD logic;
```
