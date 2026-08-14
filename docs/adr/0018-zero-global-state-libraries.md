---
id: 0018
title: Prohibición de Librerías de Estado Global (Zero Zustand/Redux)
status: proposed
date: 2026-06-18
deciders: [TBD]
supersedes: []
superseded-by: []
---

# 0018 — Prohibición de Librerías de Estado Global (Zero Zustand/Redux)

## Contexto

En aplicaciones React a gran escala, suele existir la tentación de instalar un gestor de estado global (Redux, Zustand, Recoil). Sin embargo, ArtSanctuary utiliza React 19 y Server Components, lo que empuja el estado y el caché de datos directamente a la red (Server) y al sistema de rutas (Next.js).

## Decisión

El proyecto operará bajo el principio **"Zero Global State Management Library"**. Todo estado que deba ser persistido en UI se gestionará usando `React Context` segregado por dominio de negocio (ej. `ChromeProvider`, `AppPreferencesProvider`, `BoardContext`).

## Consecuencias

- **Positivas:** Menor tamaño del *bundle*. Fuerza a los desarrolladores a colocar el estado cerca de donde se necesita (colocation) en lugar de crear monolitos de datos.
- **Negativas:** Existe riesgo de *Prop Drilling* o anidación excesiva de Proveedores de Contexto (Context Hell) si no se diseñan bien las ranuras (children/slots).

## Línea de Tiempo e Intentos Fallidos (El "Cementerio de Soluciones")

⚠️ **Crucial para la IA y desarrolladores futuros:**
1. **Intento 1 (Uso de librerías de terceros complejas):**
   - **Qué se hizo:** Intentos iniciales de acoplar la sincronización estado de UI con el de Servidor vía Redux.
   - **Por qué falló:** Redundancia. El `App Router` de Next.js ya provee la capa de hidratación de caché. Un gestor global creaba "Double source of truth" desfasada con la URL y el Server.
