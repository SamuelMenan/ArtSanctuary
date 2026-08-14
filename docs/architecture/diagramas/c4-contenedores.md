---
title: "Modelo C4 - Nivel 2: Contenedores"
audience: dev, architect
status: stable
updated: 2026-08-14
---

# Modelo C4 - Nivel 2: Contenedores

> Los **Server Components** viven en `src/frontend/features/*/screens/`; los
> `page.tsx` del router solo los re-exportan. Ver
> [`../estructura-optimizada.md`](../estructura-optimizada.md#️-el-malentendido-más-caro-dónde-vive-el-server-component).

Este diagrama amplía el sistema `ArtSanctuary` para revelar los contenedores principales (aplicaciones web, APIs, capas lógicas y bases de datos) que componen la plataforma.

## Explicación del Diagrama
1. **Single Page Application (Client Components):** Todo el código React interactivo que corre en el navegador del usuario (incluyendo Konva.js para los tableros).
2. **Server App (Next.js App Router):** El entorno de Node.js donde viven los Server Components y los controladores de la API. Aquí ocurre el renderizado HTML inicial y la protección de rutas.
3. **Capa de Servicios Puros:** El núcleo de Clean Architecture. Biblioteca interna con toda la lógica de negocio, **aislada de HTTP y de React**. Matiz verificado: dos servicios (`explore`, `artworks`) importan `unstable_cache` de `next/cache`, así que no son agnósticos del framework al 100%, aunque sí de HTTP.

## Diagrama (Mermaid C4)

```mermaid
C4Container
    title Container diagram for ArtSanctuary
    
    Person(artist, "Artista", "Usuario de la plataforma")
    
    Container_Boundary(c1, "ArtSanctuary Platform") {
        Container(spa, "Client Application", "React, Tailwind, Konva", "Provee la interfaz rica, herramientas de dibujo interactivo y modales de la comunidad.")
        Container(rsc, "Server Router (Next.js)", "Node.js, React", "Renderiza RSC (HTML inicial), sirve como capa BFF (Backend For Frontend) y controladores API.")
        Container(services, "Capa de Servicios Puros", "TypeScript", "Lógica de negocio encapsulada, agnóstica de framework HTTP. Se comunica con modelos.")
    }
    
    ContainerDb(db, "MongoDB", "Mongoose", "Almacena colecciones de la plataforma de forma estructurada.")
    
    Rel(artist, spa, "Visita la web usando HTTPS", "Browser")
    Rel(spa, rsc, "Llama a endpoints API para mutar Y para leer", "JSON / HTTPS")
    Rel(rsc, services, "Llama a funciones de negocio y de DB directamente en memoria", "Node.js")
    Rel(services, db, "Lee y escribe colecciones", "Mongoose Driver")
```
