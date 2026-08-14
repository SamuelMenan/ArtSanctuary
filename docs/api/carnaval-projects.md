---
title: Rutas API de Carnaval
audience: backend
status: stable
updated: 2026-06-03
owner: TBD
---

# API: Proyectos de Carnaval (`/api/carnaval-projects`)

Este conjunto de rutas gestiona el backend del Workspace Carnaval, incluyendo el CRUD de proyectos, la serialización de planos (Boards) y la inmutabilidad de versiones. Todas las respuestas siguen la convención `apiOk`/`apiError`.

## Endpoints Principales

### `GET /api/carnaval-projects`
Retorna la lista de proyectos de Carnaval pertenecientes al usuario autenticado.
- **Respuesta**: `{ data: { projects: ICarnivalProject[] } }`
- **Nota**: Solo devuelve la metadata básica, omitiendo el pesado arreglo interno de `boards` para favorecer tiempos de carga rápidos (ver Phase 11).

### `POST /api/carnaval-projects`
Crea un nuevo proyecto de Carnaval en blanco.
- **Body Requerido**: `{ title: string, kind: string, editionYear: number }`
- **Validación**: El `kind` debe ser un `ProjectKind` válido definido en la librería de reglas del Carnaval.
- **Proceso Interno**: Instancia el contenedor `CarnivalProject` y autogenera los `Board` obligatorios para esa modalidad.

### `GET /api/carnaval-projects/[id]`
Retorna el detalle completo del proyecto, incluyendo los tableros (planos) activos.
- **Comportamiento Especial**: Mapea manualmente el arreglo de IDs de `planos` cruzándolos con la colección `boards`. Retorna el proyecto populado completo.

### `PATCH /api/carnaval-projects/[id]`
Actualiza parámetros del expediente (título, descripción, etc.).

## Endpoints de Versiones (Snapshots)

### `GET /api/carnaval-projects/[id]/versions`
Lista el historial de versiones/snapshots generados para este proyecto.
- **Seguridad**: Proyección optimizada (`.select("-planos.objects -planos.background")`) que evita descargar los arrays masivos de trazos de Konva, basándose en la pre-computación del campo `objectCount`.

### `POST /api/carnaval-projects/[id]/versions`
Toma el estado *actual* de todos los planos del proyecto (sus `Board`s) y los clona en profundidad de manera inmutable dentro de un nuevo documento `CarnivalProjectVersion`.
- **Uso Crítico**: Imprescindible para el envío final de la propuesta a los Jurados de Corpocarnaval.

### `GET /api/carnaval-projects/[id]/versions/[vid]`
Retorna la versión inmutable específica en todo su peso gráfico, permitiendo al frontend renderizar en modo "solo-lectura" el estado exacto en el que el artesano guardó la propuesta.
