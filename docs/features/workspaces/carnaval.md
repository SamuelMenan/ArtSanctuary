---
title: Carnaval Workspace
audience: backend, frontend, product
status: stable
updated: 2026-06-03
owner: TBD
---

# Workspace Carnaval (Corpocarnaval)

Módulo especializado de ArtSanctuary enfocado en la acreditación técnica de artesanos para el Carnaval de Negros y Blancos de Pasto.

## 1. Visión General
A diferencia del Workspace "Libre", el **Carnaval Workspace** impone reglas de negocio estrictas, tipologías de vistas (Planos) y validaciones automatizadas para garantizar que los proyectos presentados por los artesanos cumplan con los requerimientos legales y físicos de Corpocarnaval (alturas máximas, dimensiones de bastidores, cantidad máxima de figuras, etc.).

## 2. Arquitectura Base
El ecosistema de Carnaval está regido por dos componentes principales de base de datos:
- **`CarnivalProject`**: Entidad contenedora del proyecto. Define la modalidad (ej. *Carroza*, *Disfraz Individual*) y gestiona metadatos del artista.
- **`Board` (Motor Gráfico)**: Los lienzos de dibujo (Konva) son reutilizados. Cada plano oficial (ej. *Plano Frontal*) es instanciado como un `Board` asociado al proyecto.
- **`CarnivalProjectVersion`**: Instantáneas de solo lectura (Snapshots) que guardan el estado de los planos de un proyecto en el tiempo para revisiones de jurados. Optimizado con conteos (`objectCount`) para no bloquear el Event Loop.

## 3. Modalidades y Planos Reglamentarios
El motor valida dinámicamente diferentes configuraciones según el `ProjectKind`:
- **Disfraz Individual** / **Murga** / **Comparsa** / **Carroza No Motorizada** / **Carroza** / **Carro Alegórico**.

Dependiendo de la modalidad, el sistema exige generar ciertos **Planos**:
- **Frontal**: Obligatorio en todos.
- **Lateral**: Obligatorio en carrozas y carros.
- **Posterior**: Opcional/Obligatorio según modalidad.
- **Superior (Planta)**: Distribución espacial.
- **Detalle Jugadores**: Interacción humana.
- **Estructura/Bastidores**: Chasis interior.

## 4. Extensiones del Board (Plugins)
Al entrar al Workspace de Carnaval, el `Board` de ArtSanctuary muta utilizando el sistema de Extensiones (`WorkspaceHost`):
1. **CarnavalGuideLayer**: Inyecta mallas dinámicas obligatorias y figuras a escala humana (1.70m) generadas automáticamente según el modo (Frontal/Lateral).
2. **CarnavalInspector**: Panel lateral específico para reglas de negocio (validación en tiempo real).
3. **CarnavalOverlays**: Líneas de cota automáticas y advertencias in-canvas (ej. "Borde a menos de 20cm del suelo").

## 5. Reglas de Validación (Motor Reglamentario)
Ubicado en `src/shared/lib/workspaces/carnaval/rules.ts`. Valida en vivo:
- **Límites de Dimensiones**: Altura, ancho y profundidad máximos permitidos por modalidad.
- **Alturas Mínimas**: El borde inferior de las faldas/bastidores no puede estar a menos de `0.20m` del suelo.
- **Validación de Componentes**: Identificación de figuras humanas (`HumanFigure`) y su interacción con el chasis.

## 6. Expediente y Biblioteca Cultural
El Workspace incluye rutas adicionales orientadas a la formalidad:
- `/dashboard/workspaces/[id]/expediente`: Resumen técnico, historial de versiones y estado de acreditación.
- `/dashboard/workspaces/[id]/recursos`: **Biblioteca Cultural**. Descarga de PDFs oficiales, normativas, y comunicados históricos (Phase 10).
