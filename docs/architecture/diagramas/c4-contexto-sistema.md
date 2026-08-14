---
title: "Modelo C4 - Nivel 1: Contexto del Sistema"
audience: dev, architect
status: stable
updated: 2026-06-01
---

# Modelo C4 - Nivel 1: Contexto del Sistema

El diagrama de Contexto del Sistema muestra a ArtSanctuary desde la vista más lejana posible. Se enfoca en los usuarios que interactúan con la plataforma y los sistemas externos de los que ArtSanctuary depende para funcionar.

## Explicación del Diagrama
- **Artista/Usuario:** Es el actor principal que utiliza las herramientas visuales y las funciones sociales.
- **ArtSanctuary:** El sistema central.
- **Sistemas Externos:** MongoDB (para datos estructurados) y Vercel Blob / FileSystem (para almacenar imágenes, avatares y recortes).

## Diagrama (Mermaid C4)

```mermaid
C4Context
    title System Context diagram for ArtSanctuary
    
    Person(artist, "Artista / Usuario", "Un artista que busca organizar sus referencias, analizar proporciones e interactuar con la comunidad.")
    
    System(artsanctuary, "ArtSanctuary", "Plataforma social y suite de herramientas web (Boards, Grid, Crop) para artistas.")
    
    System_Ext(mongodb, "MongoDB Atlas", "Base de datos principal (Usuarios, Obras, Tableros, Notificaciones).")
    System_Ext(blob, "Blob Storage / FS", "Almacenamiento de imágenes subidas (Avatares, Obras, Recortes).")
    
    Rel(artist, artsanctuary, "Sube obras, gestiona tableros infinitos y consume contenido.")
    Rel(artsanctuary, mongodb, "Lee y escribe datos de aplicación.")
    Rel(artsanctuary, blob, "Almacena y recupera recursos multimedia.")
```
