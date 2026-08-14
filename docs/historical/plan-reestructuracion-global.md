---
title: "Plan Maestro: Reestructuracion Global (Arquitectura Limpia y Rendimiento)"
audience: dev, ai-agent
status: completed
updated: 2026-06-01
owner: TBD
---

# Plan Maestro: Reestructuracion Global (Arquitectura Limpia y Rendimiento)

> ✅ **COMPLETADO (2026-06-01).** Fases 1 y 2 ejecutadas. Métricas §6 cumplidas:
> 0 `route.ts` importan `@backend/models`, 0 `fetch('/api')` en Server Components,
> promedio ~20 LOC por route, contratos JSON idénticos. tsc + tests verdes.
>
> **Commits**: boards `49aa23a` · users `8e50687` · collections `0d2038b` ·
> artworks `4160753` · notifications `acb8721` · explore/preferences/auth `a21aee3` ·
> settings `6ac7a81`. Servicios en `src/backend/services/`.
>
> **Fases 3 y 4 (opcionales) extraídas a planes propios**:
> - Fase 3 (manejador de errores global) → [`plan-api-error-handler.md`](./plan-api-error-handler.md).
> - Fase 4 (eliminación de código muerto) → [`plan-api-dead-code.md`](./plan-api-dead-code.md).

## 1. Contexto y Objetivos

> **Lectura Obligatoria para Agentes IA:** Antes de ejecutar este plan, es crítico revisar el diagrama de componentes en [`../architecture/diagramas/c4-contenedores.md`](../architecture/diagramas/c4-contenedores.md) y las reglas de frontera en [`../architecture/diagramas/limites-dependencias-arquitectura.md`](../architecture/diagramas/limites-dependencias-arquitectura.md) para comprender el flujo permitido de datos.

El repositorio requiere una separacion estricta de responsabilidades (Clean Architecture) para mitigar dos problemas criticos:
1. **Acoplamiento HTTP-Logica:** Los archivos en `src/app/api/**/route.ts` contienen validacion HTTP, resolucion de base de datos (Mongoose) y reglas de negocio, resultando en modulos de dificil mantenimiento.
2. **Cascadas de Red (Network Waterfalls):** Existen componentes de servidor (RSC) que consumen datos a traves de peticiones HTTP locales (`fetch('/api/...')`), introduciendo latencia innecesaria de red y serializacion.

**Objetivo Principal:** Implementar el Patron Controlador-Servicio. Mover la logica de dominio a modulos agnosticos (`src/backend/services`), adelgazar la capa de enrutamiento (`src/app`), y eliminar peticiones HTTP internas aprovechando el entorno Node.js de los Server Components.

## 2. Secuencia de Ejecucion del Proyecto

Para evitar regresiones y conflictos de estado, este plan forma parte de una secuencia mayor y **DEBE** ejecutarse primero:

1. **`plan-reestructuracion-global.md` (Este documento):** Establece la arquitectura base, extrayendo servicios y optimizando el data-fetching en servidor.
2. **`plan-rendimiento.md`:** Se enfoca en optimizaciones de cliente (carga perezosa de i18n, reduccion del arbol `'use client'`).
3. **`plan-i18n-maestro.md`:** Traduccion final del codigo. Requiere el cargador i18n optimizado del plan 2.

## 3. Especificacion de la Arquitectura Objetivo

La base de codigo se organizara bajo limites estrictos:

### 3.1 Capa de Negocio: `src/backend/services/`
Modulos TypeScript puros encargados de orquestar operaciones de dominio.
- **Responsabilidad:** Consultas a DB, validacion de reglas de negocio.
- **Restriccion A:** Prohibido importar objetos o utilidades dependientes de HTTP (`NextRequest`, `NextResponse`, `headers`, `cookies`).
- **Restriccion B:** Deben retornar Plain Old JavaScript Objects (POJO). Al usar Mongoose, se debe forzar `.lean()` o limpiar el output, ya que los Server Components no pueden serializar instancias de clases complejas.

### 3.2 Capa de Controladores HTTP: `src/app/api/`
Puntos de entrada para mutaciones del cliente o integraciones externas.
- **Responsabilidad:** Extraer parametros (Body, Query, Auth), invocar funciones de `backend/services`, y emitir codigos de estado HTTP.
- **Restriccion:** No deben ejecutar consultas Mongoose directas ni contener logica condicional de negocio superior a la validacion estructural de entrada.

### 3.3 Capa de Server Components: `src/app/(rutas)`
Renderizado de vistas y fetching inicial seguro.
- **Responsabilidad:** Leer parametros de URL/Cookies, invocar funciones de `backend/services` **directamente** (a nivel de funcion, en memoria), y pasar los POJO resultantes a los componentes de interfaz en `src/frontend`.
- **Restriccion:** Prohibido usar `fetch` hacia dominios internos (ej. `fetch('/api/...')`).

## 4. Ejemplos de Refactorizacion (Antes y Despues)

### Antes: Endpoint Acoplado
```typescript
// src/app/api/boards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@backend/auth/requireUser";
import Board from "@backend/models/Board";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  // Lógica acoplada al controlador
  const boards = await Board.find({ owner: auth.user.id }).lean();
  return NextResponse.json({ boards });
}
```

### Despues: Patron Controlador-Servicio
```typescript
// 1. SERVICIO: src/backend/services/boards.service.ts
import Board from "@backend/models/Board";

export async function getUserBoards(userId: string) {
  return await Board.find({ owner: userId }).lean();
}

// 2. CONTROLADOR: src/app/api/boards/route.ts
import { requireUser } from "@backend/auth/requireUser";
import { apiOk, apiError } from "@backend/http/errors";
import { getUserBoards } from "@backend/services/boards.service";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const boards = await getUserBoards(auth.user.id);
    return apiOk({ boards });
  } catch (error) {
    return apiError("INTERNAL_ERROR", error.message);
  }
}

// 3. SERVER COMPONENT: src/app/dashboard/boards/page.tsx
import { getUserBoards } from "@backend/services/boards.service";
import { getCurrentUser } from "@backend/auth/session";
import { BoardsView } from "@frontend/features/tools/boards/BoardsView";

export default async function BoardsPage() {
  const user = await getCurrentUser();
  // Llamada a memoria, sin fetch HTTP
  const boards = await getUserBoards(user.id);
  
  return <BoardsView initialBoards={boards} />;
}
```

## 5. Fases de Ejecucion

Para la aplicacion segura mediante agentes IA o humanos, el refactor se hara en ciclos pequeños y verificables.

### Fase 1: Fundacion y Extraccion de Servicios
1. Crear el directorio `src/backend/services/`.
2. Identificar el dominio con menor acoplamiento (ej. `boards`).
3. Extraer la logica de base de datos desde `app/api/boards/**/route.ts` hacia `backend/services/boards.service.ts`.
4. Refactorizar el controlador HTTP para que consuma el servicio.
5. Confirmar que los tests pasan y el comportamiento HTTP es identico.
6. Repetir por dominio iterativamente: `collections`, `users`, `settings`, `artworks`.

### Fase 2: Cortocircuito de Fetching (RSC Optimization)
1. Escanear `src/app/**/page.tsx` y layouts en busca de `fetch('/api/...', { ... })` o equivalentes de librerias de fetching ejecutadas en el servidor.
2. Reemplazar estas llamadas por la inyeccion directa del servicio correspondiente (`await getDomainData()`).
3. Asegurar que los datos viajen correctamente serializados hacia los Client Components hijos.

### Fase 3: Estandarizacion de Errores y Wrapper de API
1. Implementar un manejador de excepciones global (ej. `withErrorHandler`) para los controladores en `app/api/`, garantizando que cualquier excepcion lanzada por los servicios sea interceptada y mapeada consistentemente usando la utilidad preexistente `@backend/http/errors`.

### Fase 4: Limpieza y Eliminación de Código Obsoleto (Dead Code Elimination)
1. **Auditoría de API Routes:** Identificar endpoints en `src/app/api/` que, tras ejecutar la Fase 2, hayan quedado sin uso por parte del cliente. Si un endpoint solo existía para ser consumido internamente por un Server Component, **debe eliminarse físicamente** la carpeta y el archivo `route.ts`.
2. **Borrado de Wrappers de Fetch:** Buscar y eliminar funciones utilitarias o *helpers* diseñados exclusivamente para envolver peticiones HTTP locales.
3. **Limpieza de Tipos:** Eliminar interfaces o DTOs (Data Transfer Objects) creados únicamente para serializar respuestas HTTP de rutas que acaban de ser borradas.

## 6. Metricas de Exito y Validacion

- **Validacion Estatica:** Ejecutar un linter o script que asegure que no existen imports de `@backend/models/*` dentro de `src/app/**/route.ts`.
- **Ausencia de HTTP Local:** El conteo de ocurrencias de `fetch('/api/` dentro de archivos Server Component (sin `'use client'`) debe ser exactamente 0.
- **Tamaño de Controladores:** El promedio de lineas de codigo (LOC) por archivo en `src/app/api/` debe ser inferior a 30 lineas.
- **Estabilidad de Contratos:** La respuesta JSON de todos los endpoints de la API debe mantener su esquema original para no romper contratos con aplicaciones cliente moviles o de terceros.
