---
title: Libre Workspace
audience: backend, frontend, product
status: stable
updated: 2026-06-03
owner: TBD
---

# Workspace Libre

El **Workspace Libre** es el entorno creativo por defecto dentro de ArtSanctuary. Está diseñado para ofrecer una experiencia sin restricciones, centrada en la ideación y construcción fluida.

## 1. Visión General
A diferencia del [Workspace Carnaval](carnaval.md), que cuenta con reglas estrictas y limitaciones normativas, el Workspace Libre provee acceso irrestricto a los tableros infinitos (Boards) de dibujo.

## 2. Arquitectura Base
- Un usuario puede tener múltiples proyectos dentro de su entorno "Libre".
- Cada proyecto sirve simplemente como un folder organizativo para uno o varios `Board` (lienzos).
- No cuenta con el concepto de "Versiones Reglamentarias" (snapshots inmutables), solo guardado normal y persistente del estado del tablero.

## 3. Extensiones y Comportamiento del Board
El `Board` instanciado dentro de un Workspace Libre se ejecuta con su configuración nativa o con el plugin `libre`:
- **Inyección Plana**: No inyecta mallas de referencias ni reglas.
- **Herramientas al 100%**: El menú lateral tiene a disposición la herramienta Canon, herramientas de medición global, notan y recortes sin límites reglamentarios.
- **Feedback**: El Inspector Lateral solo refleja propiedades nativas de los objetos (rotación, posición, escala) y no emite alertas ni errores por "incumplimiento".

## 4. Rutas Asociadas
- `/dashboard/workspaces`: Pantalla de selección/creación inicial de proyectos donde el usuario opta por "Libre" o "Carnaval".
- `/dashboard/workspaces/[id]`: Acceso al tablero principal con la extensión básica y el layout limpio.
