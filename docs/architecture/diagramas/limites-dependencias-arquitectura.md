---
title: "Reglas de Importación y Fronteras Arquitectónicas"
audience: ai-agent, dev
status: stable
updated: 2026-06-01
---

# Reglas de Importación y Fronteras (Límites Arquitectónicos)

Para una IA (o cualquier herramienta de linting), entender el problema a veces es menos importante que **entender lo que NO se debe hacer**. Este diagrama traza las reglas estrictas de acoplamiento de la base de código.

## Restricciones Críticas para la IA
1. **Frontend NUNCA toca el Backend directamente:** El directorio `src/frontend` jamás debe importar nada de `src/backend/models`.
2. **API Routes son "Tontas":** Los archivos `route.ts` de `src/app/api/` tienen estrictamente prohibido importar esquemas Mongoose o interactuar con la base de datos de manera directa; deben cruzar la frontera hacia `src/backend/services`.
3. **Servicios son Agnosticos:** Los servicios en `src/backend/services` nunca deben importar tipos u objetos como `NextRequest` o `NextResponse`. Son funciones puras que retornan objetos de JavaScript.

## Diagrama (Mermaid Flowchart)

```mermaid
flowchart TD
    subgraph Frontend ["src/frontend/"]
        UI["Componentes UI / Hooks"]
    end

    subgraph App ["src/app/"]
        RSC["Server Components (page.tsx)"]
        API["API Routes (route.ts)"]
    end

    subgraph Backend ["src/backend/"]
        SVC["Services (Lógica)"]
        MOD["Models (Mongoose)"]
        AUTH["Auth Logic"]
    end

    %% Enlaces permitidos (Verdes)
    RSC -->|"1. Inyecta Props"| UI;
    RSC -->|"2. Llama"| SVC;
    API -->|"3. Llama"| SVC;
    SVC -->|"4. Accede a"| MOD;
    SVC -->|"5. Verifica"| AUTH;

    %% Enlaces Prohibidos (Rojos)
    UI -.->|"PROHIBIDO (Fuga de Secretos)"| MOD;
    API -.->|"PROHIBIDO (Lógica en Controlador)"| MOD;
    SVC -.->|"PROHIBIDO (Ciclo Circular)"| Frontend;
    SVC -.->|"PROHIBIDO (Acoplamiento HTTP)"| App;

    linkStyle 0,1,2,3,4 stroke:#22c55e,stroke-width:2px;
    linkStyle 5,6,7,8 stroke:#ef4444,stroke-width:2px,stroke-dasharray: 5 5;
```
