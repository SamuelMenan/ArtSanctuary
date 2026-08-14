---
id: 0014
title: Centralización de estilos de AppBar (UI compartida)
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0014 — Centralización de Estilos de AppBar (UI Shared)

## Contexto
En el frontend, existían múltiples barras superiores (el Navbar global, el AppBar de la herramienta Canon, el de Boards, etc.). Anteriormente, cada una definía su propio espaciado, estilo de botones y alturas, lo que provocaba inconsistencias visuales, márgenes desiguales y una experiencia fragmentada.

## Decisión
Se ha creado un único archivo de tokens de estilo exportados: `src/frontend/shared/layouts/appbar/appBarStyles.ts`.
**Regla Inquebrantable:**
Toda barra superior (principal o secundaria) a lo largo de toda la aplicación, y todo botón contenido en ellas, debe **obligatoriamente** importar y aplicar las constantes de clases de Tailwind definidas en este archivo (ej. `appBarShell`, `appBarIconBtnIdle`).
Queda **prohibido** que un componente defina alturas estáticas (`h-14`), colores arbitrarios o estilos de botón personalizados para las barras superiores. 

## Consecuencias
- **Positivas:** Coherencia absoluta ("Pixel Perfect") entre todas las vistas. Si se decide cambiar la altura de la barra superior, se altera una sola constante y afecta a toda la aplicación instantáneamente.
- **Negativas:** Menos libertad para que una vista tenga una barra de diseño "especial" o desalineada de los tokens globales.
