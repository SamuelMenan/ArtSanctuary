---
title: "Flujo de Datos: RSC vs. Mutaciones del Cliente"
audience: dev
status: stable
updated: 2026-06-01
---

# Flujo de Datos: RSC vs. Mutaciones del Cliente

Este diagrama ilustra la diferencia fundamental en cómo se obtienen y envían los datos en la arquitectura actual. Está diseñado para aprovechar los React Server Components (RSC) y reducir la carga sobre el cliente.

## Explicación del Diagrama

1. **Flujo de Lectura (Carga Inicial):**
   Cuando un usuario navega a una página (ej. `/dashboard`), la solicitud no realiza saltos HTTP adicionales en el servidor. El componente de servidor (`page.tsx`) llama **directamente en memoria** a las funciones de `src/backend/services`. Estos servicios se comunican con MongoDB, obtienen los datos puros (POJOs) y se los pasan al componente para que renderice el HTML. Esto garantiza el tiempo de respuesta (TTFB) más rápido posible.

2. **Flujo de Escritura (Interactividad):**
   Cuando el usuario realiza una acción en el navegador (como crear un tablero o dar "Me gusta"), un *Client Component* (`'use client'`) envía una petición HTTP `fetch` a la API (`src/app/api/route.ts`). El controlador de la API valida la autenticación, extrae los parámetros y delega la ejecución de negocio al mismo servicio (`src/backend/services`).

## Diagrama (Mermaid)

```mermaid
sequenceDiagram
    participant B as Browser (Cliente)
    participant RSC as Server Component (app/page.tsx)
    participant API as API Route (app/api/route.ts)
    participant SVC as Backend Service (src/backend/services)
    participant DB as MongoDB

    Note over B, DB: FLUJO DE LECTURA (Carga Inicial)
    B->>RSC: GET /dashboard
    RSC->>SVC: await getUserBoards(id)
    SVC->>DB: Board.find().lean()
    DB-->>SVC: POJO (Datos)
    SVC-->>RSC: POJO (Datos)
    RSC-->>B: HTML Pre-renderizado con Datos

    Note over B, DB: FLUJO DE ESCRITURA (Interactividad)
    B->>API: POST /api/boards (JSON)
    API->>SVC: await createBoard(data)
    SVC->>DB: Board.create()
    DB-->>SVC: Documento
    SVC-->>API: POJO (Datos)
    API-->>B: HTTP 200 OK (JSON)
```
