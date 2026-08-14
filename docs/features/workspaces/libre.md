---
title: Libre Workspace
audience: backend, frontend, product
status: wip
updated: 2026-08-14
owner: TBD
---

# Workspace Libre

> ⚠️ **NO ESTÁ IMPLEMENTADO.** Verificado el 2026-08-14: `libre/ui.ts` es un
> stub con **`enabled: false`** ("próximamente"), sin `variants` ni
> `createProject`; `WorkspacesScreen` lo renderiza deshabilitado y corta con
> `if (!plugin.enabled) return`. No existe extensión de lienzo libre
> (`libre/index.ts` solo hace `import './ui'`), y el `kind` por defecto de
> `CarnivalProject` es `'carnaval'`.
>
> Todo lo que sigue describe la **intención de diseño**, no el comportamiento
> actual. No construir suposiciones sobre esto sin comprobar el código.

## 1. Visión General
A diferencia del [Workspace Carnaval](carnaval.md), que cuenta con reglas estrictas y limitaciones normativas, el Workspace Libre **pretende** proveer acceso irrestricto a los tableros infinitos (Boards) de dibujo.

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

Corregido 2026-08-14 — la ruta del tablero estaba mal:

- `/dashboard/workspaces`: selección de proyectos. Hoy la tarjeta de "Libre"
  aparece **deshabilitada**.
- `/dashboard/workspaces/[id]`: **no es el tablero**, es
  `WorkspaceProjectScreen` (lista de planos y versiones del proyecto).
- `/dashboard/workspaces/[id]/boards/[boardId]`: aquí sí está el tablero.
