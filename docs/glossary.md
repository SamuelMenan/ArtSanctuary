---
title: Glossary
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Glossary

Términos del dominio y la implementación. Definición corta + link a feature/doc.

## Dominio

**Alma Creativa**
Modelo freemium del proyecto. Plan `free` por default, `pro` con features
extendidas. Ver `src/backend/models/User.ts:plan`.

**Artista**
Usuario que publica obras. No hay tipo de cuenta separado — todo `User` puede
ser artista.

**Obra / Artwork**
Pieza registrada por un artista. Incluye metadata tipo museo (técnica, medio,
materiales, fecha de creación). Ver [`architecture/data-model.md#artwork`](architecture/data-model.md#artwork).

**Colección / Collection**
Agrupación de obras curadas por un usuario. Pueden ser públicas o privadas.

**Mutual**
Relación social bidireccional: A sigue a B **y** B sigue a A. Visible como chip
"Te sigue" en perfiles. Ver `src/app/profile/[id]/page.tsx`.

**Notan**
Técnica de simplificación tonal en arte. Una de las herramientas en
`/dashboard/tools/notan`.

**EXIF**
Metadatos embebidos en imágenes (cámara, fecha, GPS). Extraídos en flujo de
upload para auto-completar formulario.

**Discipline / Medium / Technique**
Trío de clasificación de obra:
- Discipline: categoría amplia (pintura, escultura)
- Medium: soporte físico (lienzo, papel)
- Technique: método (óleo, acuarela)

**Workspace**
Entorno de trabajo donde convergen las herramientas del ecosistema (Boards, Canon, etc). Puede ser "Libre" o estar sujeto a reglas específicas como "Carnaval".

**Carnaval / Corpocarnaval (Workspace)**
Módulo especializado para la acreditación técnica del Carnaval de Negros y Blancos. Aplica reglas dinámicas (alturas, dimensiones) según la **Modalidad**.

**Modalidad (Carnaval)**
Categoría de participación (Disfraz, Comparsa, Carro Alegórico, Carroza) que define las métricas, planos obligatorios y validaciones reglamentarias de un proyecto.

**Plano / Vista**
Representación gráfica obligatoria de una modalidad (Frontal, Lateral, Superior, Jugadores, Bastidores). Cada plano es internamente un `Board` asociado al proyecto.

**Versión (Snapshot)**
Copia de solo lectura e inmutable del estado completo de los planos de un proyecto de Carnaval en un momento del tiempo (`CarnivalProjectVersion`). Implementado con optimizaciones de consulta para `objectCount`.

**Biblioteca Cultural**
Repositorio local dentro del Workspace Carnaval donde el usuario puede acceder a Reglamentos, Guías de Acreditación y Comunicados oficiales.

## Implementación

**tokenVersion**
Contador en `User` que invalida sesiones JWT al rotarse. Mecanismo principal de
logout-all y revocación tras cambio de password/email. Ver
[ADR-0001](adr/0001-jwt-tokenversion.md).

**requireUser**
Helper de `src/backend/auth/requireUser.ts`. Valida sesión, conecta DB, carga User. Devuelve
discriminated union `{ ok: true, user } | { ok: false, response }`. Estándar en
todos los endpoints autenticados.

**apiOk / apiError**
Helpers de `src/backend/http/errors.ts`. Garantizan response shape consistente. Códigos
tipados (UNAUTHORIZED, VALIDATION_ERROR, CONFLICT, etc).

**resolvedTheme**
Tema efectivo aplicado al DOM. Distinto de `theme` raw del usuario: si
`theme='system'`, `resolvedTheme` es `dark` o `light` según
`matchMedia('(prefers-color-scheme: dark)')`. Ver
[`frontend/theming.md`](frontend/theming.md).

**Eyebrow**
Etiqueta pequeña en mono uppercase encima de un título. Patrón visual recurrente
en el design system. Ver [`frontend/design-system.md`](frontend/design-system.md).

**Pull quote**
Bio renderizada como blockquote con border-left primary. Patrón editorial usado
en `ProfileMetaBlock`.

**Metric card**
Celda compacta con número grande + label uppercase. Usado para mostrar conteos
(obras, seguidores, seguidos) en `ProfileHero`.

**Empty state**
Estado vacío con composición visual (marcos rotados + hatch diagonal) en lugar
de solo texto. Aplicado a `EmptyPortfolio`.

**Hatch pattern**
Líneas diagonales paralelas como fondo. Implementado con
`repeating-linear-gradient` CSS. Usado en empty states.

**RSC (React Server Component)**
Componente renderizado en servidor sin hydration. Sin `'use client'`. Puede ser
`async`, acceder a DB directo. Default en App Router.

**Client component**
Componente con `'use client'` en línea 1. Hydrata en cliente. Puede usar hooks
React + browser APIs. Necesario para `useState`, `useEffect`, listeners.

**Status hook (`useStatus`)**
Hook compartido en `src/frontend/features/settings/useStatus.ts` para estado de operación
async (idle/loading/success/error) con auto-reset.

**StatusBanner**
Componente visual de feedback de operación. Wrapper de `useStatus` con
`role=alert/status` + `aria-live=polite`.

**Toggle**
Switch accesible con `role=switch` + `aria-checked`. Usado en
notif/privacy/danger zone.

**Dirty / diff**
Patrón en `ProfileForm`: mantener `state` actual + `savedInitial`, calcular diff
para enviar solo campos modificados. Bloquea submit si `!changed`.

**Optimistic toggle**
Patrón en `NotificationsForm` / `PrivacyForm`: aplicar estado nuevo inmediato,
revertir si servidor rechaza. Mejor UX que blocking.

**Cascada (delete)**
Borrado secuencial de recursos relacionados al eliminar usuario:
artworks → collections → notifications → pulls de follow → user. Sin
transacción. Ver [ADR-0004](adr/0004-hard-delete-sin-tx.md).

**Soft delete / Deactivate**
Marca `status='deactivated'` en User sin borrar datos. Reactiva automáticamente
en próximo login válido. Alternativa al hard delete.

**Hard delete**
`DELETE /api/settings/account` ejecuta cascada irreversible. Confirmación
doble: password + typed `ELIMINAR`.

**emailPendingChange**
Campo en User reservado para flujo futuro de verificación email doble paso.
Hoy `null` siempre. Estructura preparada para SMTP provider.

**Motion**
Librería de animación (`motion/react`, sucesora de framer-motion). **Único** sistema de
animación del proyecto: toda animación se implementa con motion, no con `@keyframes` CSS.
Tokens en `src/frontend/shared/motion/tokens.ts`. Ver
[`frontend/animations.md`](frontend/animations.md).

**AnimatePresence**
Componente de motion que permite animar la **salida** de elementos al desmontarse
(errores, mensajes, cambio de modo). Sin él, solo se anima la entrada.

**useReducedMotion / MotionConfig**
Mecanismos para respetar `prefers-reduced-motion`. `<MotionConfig reducedMotion="user">`
reduce automáticamente las animaciones; `useReducedMotion()` para lógica condicional.

**AuthFlow**
Componente cliente que unifica Login y Registro (`src/frontend/features/auth/screens/AuthFlow.tsx`).
Mantiene el panel lateral fijo y anima solo la tarjeta del formulario al cambiar de modo
(transición de elemento compartido), sincronizando la URL con `history.replaceState` sin
remontar. Patrón de referencia para transiciones entre vistas que comparten layout.

## Acrónimos

| Acrónimo | Significado |
|---|---|
| ADR | Architecture Decision Record |
| RSC | React Server Component |
| FK | Foreign Key |
| MCP | Model Context Protocol (servidor en `mcp/`) |
| SSR | Server-Side Rendering |
| WCAG | Web Content Accessibility Guidelines |
| TBD | To Be Determined |

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
