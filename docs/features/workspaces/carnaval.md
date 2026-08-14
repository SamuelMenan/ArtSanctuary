---
title: Carnaval Workspace
audience: backend, frontend, product
status: stable
updated: 2026-08-14
owner: TBD
---

# Workspace Carnaval (Corpocarnaval)

> ⚠️ **Corregido 2026-08-14** tras verificar contra el código. Los errores que
> tenía este doc, por si quedó alguna copia circulando:
> - Listaba **6 modalidades** (incluía *Murga* y *Carroza No Motorizada*).
>   Reales hay **4**: `disfraz`, `comparsa`, `carroAlegorico`, `carroza`.
> - Decía que se valida "según el `ProjectKind`". Falso: `ProjectKind` es
>   `'libre'|'carnaval'`; la validación va por **`modality`**.
> - Los planos obligatorios no son "Frontal siempre, Lateral solo carrozas":
>   son **las 5 vistas siempre** (frontal, posterior, lateralIzq, lateralDer,
>   superior) + `bastidores`/`jugadores` solo si `rule.requiresPlayerZones`.
>   "Lateral" no existe como plano único.
> - "Figuras a escala humana (1.70m)" — falso: `humanRefCm = 15` (cm de
>   boceto) para disfraz/comparsa, y `null` para las carrozas.
> - "Altura mínima 0.20m del suelo" — **esa regla no existe** en `rules.ts`
>   ni en `validate.ts`.
> - `WorkspaceHost` y `HumanFigure` — **no existen como símbolos**. El sistema
>   real es `BoardExtension` (ver
>   [`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md)).

Módulo especializado de ArtSanctuary enfocado en la acreditación técnica de artesanos para el Carnaval de Negros y Blancos de Pasto.

## 1. Visión General
A diferencia del Workspace "Libre", el **Carnaval Workspace** impone reglas de negocio estrictas, tipologías de vistas (Planos) y validaciones automatizadas para garantizar que los proyectos presentados por los artesanos cumplan con los requerimientos legales y físicos de Corpocarnaval (alturas máximas, dimensiones de bastidores, cantidad máxima de figuras, etc.).

## 2. Arquitectura Base
El ecosistema de Carnaval está regido por dos componentes principales de base de datos:
- **`CarnivalProject`**: Entidad contenedora del proyecto. Define la modalidad (ej. *Carroza*, *Disfraz Individual*) y gestiona metadatos del artista.
- **`Board` (Motor Gráfico)**: Los lienzos de dibujo (Konva) son reutilizados. Cada plano oficial (ej. *Plano Frontal*) es instanciado como un `Board` asociado al proyecto.
- **`CarnivalProjectVersion`**: Instantáneas de solo lectura (Snapshots) que guardan el estado de los planos de un proyecto en el tiempo para revisiones de jurados. Optimizado con conteos (`objectCount`) para no bloquear el Event Loop.

## 3. Modalidades y Planos Reglamentarios
El motor valida según la **`modality`** del proyecto (`getCarnavalRule(modality)`).
Las 4 modalidades reales (`rules.ts`, y mismo enum en `CarnivalProject.ts`):
- `disfraz` (Disfraz Individual) · `comparsa` · `carroAlegorico` (Carro Alegórico) · `carroza` (Carroza).

Dependiendo de la modalidad, el sistema exige generar ciertos **Planos**:
- **Frontal**: Obligatorio en todos.
- **Lateral**: Obligatorio en carrozas y carros.
- **Posterior**: Opcional/Obligatorio según modalidad.
- **Superior (Planta)**: Distribución espacial.
- **Detalle Jugadores**: Interacción humana.
- **Estructura/Bastidores**: Chasis interior.

## 4. Extensiones del Board (Plugins)
Al entrar al Workspace de Carnaval, el `Board` muta utilizando el sistema de
extensiones `BoardExtension` (ver
[`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md)):
1. **CarnavalGuideLayer**: Inyecta mallas dinámicas obligatorias y una figura
   humana de referencia. La escala **no** es 1.70m: `humanRefCm = 15` (cm de
   boceto hasta hombros) para disfraz/comparsa, y `null` para las carrozas —
   `humanFigure.ts` escala sobre esos 15 cm.
2. **CarnavalInspector**: Panel lateral específico para reglas de negocio (validación en tiempo real).
3. **CarnavalOverlays**: Líneas de cota automáticas y advertencias in-canvas.

## 5. Reglas de Validación (Motor Reglamentario)

Reglas en `src/shared/lib/workspaces/carnaval/rules.ts`, motor de validación en
`validate.ts`. Lo que valida realmente:

- **Rangos por eje y modalidad** (`alto`, `ancho`, `largo`, `espesor`): cada uno
  con `min`/`max` o un valor `exact`.
- **Banda de advertencia**: `WARN_BAND = 0.1` → el 10% del rango más cercano a
  un límite da `warn`. Un `warn` **cuenta como cumple**, solo avisa.
- **Tolerancia exacta**: `EXACT_TOLERANCE_CM = 0.1`.
- **Zonas de jugadores/bastidores**: solo si `rule.requiresPlayerZones`.

No valida holgura al suelo ni "identificación de figuras humanas": ninguna de
esas dos reglas existe. La única relación con la figura humana es que
`carnavalInspect.ts` **excluye** del bounding box los objetos llamados
`'Figura humana'`.

Detalle del motor en
[`../../architecture/shared-lib.md`](../../architecture/shared-lib.md).

## 6. Planos obligatorios

`planosForModality` (`planos.ts`) genera **siempre las 5 vistas geométricas**:
`frontal`, `posterior`, `lateralIzq`, `lateralDer`, `superior` — más
`bastidores` y `jugadores` únicamente si la modalidad lo requiere.

Cada plano es un `Board` que apunta al proyecto vía **`Board.projectId`**; el
proyecto **no** guarda un array de planos.

## 7. Expediente y Biblioteca Cultural
El Workspace incluye rutas adicionales orientadas a la formalidad:
- `/dashboard/workspaces/[id]/expediente`: Resumen técnico, historial de versiones y estado de acreditación.
- `/dashboard/workspaces/[id]/recursos`: **Biblioteca Cultural**. Descarga de PDFs oficiales, normativas, y comunicados históricos (Phase 10).
- `/dashboard/workspaces/[id]/boards/[boardId]`: el tablero de un plano concreto.
- `/dashboard/workspaces/[id]/tools/[tool]`: herramientas dentro del contexto del workspace.
