---
title: "Flujo de Datos: RSC vs. Mutaciones del Cliente"
audience: dev
status: stable
updated: 2026-08-14
---

# Flujo de Datos: RSC vs. Mutaciones del Cliente

> **Hay dos caminos de lectura, no uno.** El RSC (A) evita el salto HTTP y es
> el preferido; el cliente (B) se usa cuando la lectura depende de estado de UI
> (búsqueda, filtros, polling). Confundirlos es el error más común aquí.
>
> `getPublicGallery` y `getExploreTrending` van además envueltos en
> `unstable_cache` (`revalidate: 60`, tag `artworks`), no mostrado abajo para
> no cargar el diagrama.

Este diagrama ilustra la diferencia fundamental en cómo se obtienen y envían los datos en la arquitectura actual. Está diseñado para aprovechar los React Server Components (RSC) y reducir la carga sobre el cliente.

## Explicación del Diagrama

1. **Flujo de Lectura (Carga Inicial):**
   Cuando un usuario navega a una página (ej. `/dashboard`), la solicitud no realiza saltos HTTP adicionales en el servidor. El componente de servidor (`page.tsx`) llama **directamente en memoria** a las funciones de `src/backend/services`. Estos servicios se comunican con MongoDB, obtienen los datos puros (POJOs) y se los pasan al componente para que renderice el HTML. Esto garantiza el tiempo de respuesta (TTFB) más rápido posible.

2. **Flujo de Escritura (Interactividad):**
   Cuando el usuario realiza una acción en el navegador (como crear un tablero o dar "Me gusta"), un *Client Component* (`'use client'`) envía una petición HTTP `fetch` a la API (`src/app/api/<dominio>/route.ts`). El controlador de la API valida la autenticación, extrae los parámetros y delega la ejecución de negocio al mismo servicio (`src/backend/services`).

## Diagrama (Mermaid)

```mermaid
sequenceDiagram
    participant B as Browser (Cliente)
    participant RSC as Screen (frontend/features/*/screens)
    participant API as API Route (app/api/**/route.ts)
    participant SVC as Backend Service (src/backend/services)
    participant DB as MongoDB

    Note over B, DB: LECTURA A — vía RSC (sin salto HTTP interno)
    B->>RSC: GET /gallery
    Note right of RSC: app/gallery/page.tsx solo re-exporta GalleryScreen
    RSC->>SVC: await getGalleryArtworks(category)
    SVC->>DB: Artwork.find().lean()
    DB-->>SVC: POJO
    SVC-->>RSC: POJO
    RSC-->>B: HTML pre-renderizado con datos

    Note over B, DB: LECTURA B — vía cliente (cuando depende de estado de UI)
    B->>API: GET /api/boards
    Note right of API: usado por BoardsListScreen, ExploreScreen,<br/>notifications y búsqueda ('use client')
    API->>SVC: await getUserBoards(userId)
    SVC->>DB: Board.find().lean()
    DB-->>SVC: POJO
    SVC-->>API: POJO
    API-->>B: HTTP 200 (JSON)

    Note over B, DB: ESCRITURA — siempre vía API
    B->>API: POST /api/boards (JSON)
    API->>SVC: await createBoard(data)
    SVC->>DB: Board.create()
    DB-->>SVC: Documento
    SVC-->>API: POJO
    API-->>B: HTTP 201 (JSON)
```
