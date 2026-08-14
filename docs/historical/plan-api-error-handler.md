---
title: "Plan: Manejador de errores global para controladores API"
audience: dev
status: done
updated: 2026-08-13
owner: TBD
---

> ✅ **Implementado.** `withErrorHandler` existe en `src/backend/http/handler.ts`
> y está en uso en los `route.ts` de la API. Verificado y movido a
> `docs/historical/` el 2026-08-13.

# Plan: `withErrorHandler` — manejo de errores uniforme en `app/api`

> Continuación (Fase 3) de [`plan-reestructuracion-global.md`](./plan-reestructuracion-global.md),
> ya **completado**. Aquel dejó cada controlador con su propio `try/catch`. Este
> plan los unifica detrás de un wrapper.

## Contexto

Tras extraer la lógica a `backend/services`, los controladores en `src/app/api/**/route.ts`
repiten el mismo patrón:

```ts
export async function GET() {
  try {
    /* auth + servicio + respuesta */
  } catch (error) {
    console.error("[GET /api/...]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
```

Los **servicios lanzan** excepciones; hoy cada route las atrapa a mano. Objetivo:
un **único** punto que intercepte cualquier excepción de servicio y la mapee de
forma consistente con `@backend/http/errors` (`apiError`).

## ⚠️ Decisión bloqueante: contrato de error

El `plan-reestructuracion-global` preservó **a propósito** el shape actual de error
de cada endpoint (mayoría `{ error: "string" }`; los de settings ya usan
`apiError` → `{ error: { code, message, fields } }`). **Hay dos contratos de error
conviviendo.**

Este plan **debe decidir primero** (afecta al frontend):

- **Opción A — Unificar a `apiError`** (`{ error: { code, message } }`): más limpio,
  pero **cambia el shape** de ~25 endpoints → hay que **migrar el frontend** que lee
  `data.error` como string. Es un cambio de contrato (romperá apps móviles/terceros
  si las hay).
- **Opción B — Preservar shape por endpoint**: el wrapper devuelve el mismo shape que
  hoy (string para los viejos). Cero cambio de contrato; el wrapper solo elimina el
  `try/catch` repetido y centraliza el `console.error` + status 500.

> Recomendado: **Opción B** primero (cero riesgo), y dejar la unificación a `apiError`
> como sub-fase aparte con migración coordinada del frontend.

## Diseño (Opción B)

```ts
// src/backend/http/handler.ts
import { NextResponse } from "next/server";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Envuelve un handler: cualquier excepción → log + 500 con el shape heredado. */
export function withErrorHandler<C>(tag: string, fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (error) {
      console.error(`[${tag}]`, error);
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
  };
}
```

Uso en un controlador:

```ts
export const GET = withErrorHandler("GET /api/boards", async () => {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const boards = await getUserBoards(session.user.id);
  return NextResponse.json({ boards });
});
```

Notas:
- Las respuestas de error **esperadas** (401/403/404/validación) siguen devolviéndose
  explícitamente dentro del handler (no son excepciones). El wrapper solo cubre lo
  **inesperado** (500).
- Algunos mensajes 500 difieren hoy (`"Error del servidor"`, `"Error interno"`,
  `"Error"`). Con Opción B se **conserva** el texto por endpoint pasando un override,
  o se acepta unificar **solo** el 500 (cambio menor, normalmente no leído por la UI).

## Fases

- **F0** — Crear `backend/http/handler.ts` + tests del wrapper.
- **F1** — Migrar un dominio piloto (boards) a `withErrorHandler`; verificar contrato.
- **F2** — Resto de dominios, uno por PR.
- **F3 (opcional, separada)** — Unificar errores a `apiError` (Opción A) + migrar el
  frontend que lea `data.error` string. Solo si se decide cambiar contrato.

## Métrica de éxito

- 0 bloques `try/catch` repetidos de 500 en `app/api/**/route.ts`.
- Mensajes/forma de error **sin cambios** para el cliente (Opción B).
- Build + typecheck + lint verdes.
