# Plan Técnico: Notificaciones en Tiempo Real

## Objetivo

Eliminar la espera de hasta 30 s para que una notificación aparezca. Hoy el
navbar **consulta** (`poll`) cada 30 s (`useNotifications.ts`); queremos que la
notificación llegue **al instante** en que se crea, sin recargar ni esperar al
siguiente poll.

## Estado actual

- **Modelo:** `Notification { recipientId, type, read, message, createdAt, actorId?, artworkId? }`.
- **Lectura:** `getUserNotifications(userId)` → últimas 20 + `unreadCount`.
- **Cliente:** `useNotifications.ts` hace `fetch('/api/notifications')` al montar + `setInterval(30000)`.
- **Escritura:** las acciones (like/comment/save/follow) crean un doc `Notification` (escritor disperso).
- **Infra:** Next 16 App Router · Vercel (Fluid Compute) · auth JWT por cookie · MongoDB.

El poll es simple pero: (a) latencia hasta 30 s, (b) tráfico constante aunque no haya nada nuevo.

## Opciones de transporte

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **SSE** (Server-Sent Events) | unidireccional server→cliente (justo lo que necesitamos), HTTP plano, `EventSource` reconecta solo, encaja con streaming de Fluid Compute, **sin infra extra** | conexión limitada al `maxDuration` de la función (reconecta), 1 conexión por pestaña | ✅ **Recomendado (MVP)** |
| **WebSockets** | bidireccional | Vercel serverless no mantiene WS nativo bien → requiere servicio externo o server aparte; bidireccional es overkill para notificaciones | ❌ innecesario |
| **Managed realtime** (Ably / Pusher / Upstash) | escala sin pensar, reconexión/fan-out resueltos | dependencia + coste; otra cuenta/infra | 🔶 Camino de escala (Fase 4) |
| **Poll más corto** | trivial | no es instantáneo, más tráfico | ❌ no cumple el objetivo |

**Decisión:** SSE como transporte. El reto real no es el transporte sino el
**puente** entre el escritor (crea la notificación) y la conexión SSE abierta.

## Puente escritor → conexión (pub/sub)

| Mecanismo | Cómo | Requisito | Cuándo |
|---|---|---|---|
| **MongoDB Change Streams** | la ruta SSE abre un `watch()` sobre `Notification` filtrado por `recipientId`; cada `insert` se empuja al cliente | MongoDB **replica set** (Atlas lo es por defecto) | ✅ MVP — cero infra nueva |
| **Redis pub/sub** (Upstash) | el escritor `PUBLISH user:<id>`; la ruta SSE `SUBSCRIBE` | cuenta Upstash | 🔶 si Change Streams no escala |
| **Emitter en memoria** | — | — | ❌ no funciona entre instancias serverless |

**MVP:** Change Streams. No añade infra (si ya usamos Atlas) y el filtro por
`recipientId` mantiene cada stream barato.

## Arquitectura elegida (MVP)

```
Acción (like/save/…) ──crea──> Notification (Mongo)
                                     │ change stream (insert, recipientId=user)
                                     ▼
GET /api/notifications/stream  ──SSE──>  EventSource (navbar)
   (ReadableStream, watch por usuario)        │
                                              ▼
                                    useRealtimeNotifications()
                                    (prepend + unreadCount++)
```

## Fases

### F1 — Endpoint SSE + Change Stream
- `src/backend/services/notifications.service.ts`: `watchUserNotifications(userId, onInsert)` →
  `Notification.watch([{ $match: { 'fullDocument.recipientId': <oid>, operationType: 'insert' } }], { fullDocument: 'updateLookup' })`. Devuelve el stream para poder cerrarlo.
- `src/app/api/notifications/stream/route.ts`: `GET` autenticado (`auth()`), responde
  `new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' } })`.
  - `ReadableStream`: en `start`, abre el change stream; por cada insert `controller.enqueue('data: ' + JSON.stringify(notif) + '\n\n')`.
  - Heartbeat: `: ping\n\n` cada ~25 s para mantener viva la conexión y detectar cortes.
  - `cancel()` / `req.signal` `abort` → cerrar el change stream (evitar fugas).
  - `export const maxDuration = 300` (Fluid Compute); al expirar, el cliente reconecta solo.
  - `export const dynamic = 'force-dynamic'` (sin cache).

### F2 — Hook cliente (SSE + fallback)
- Nuevo `useRealtimeNotifications.ts` (o ampliar `useNotifications`):
  - Carga inicial con el `fetch` actual (estado base + `unreadCount`).
  - Abre `new EventSource('/api/notifications/stream')` (manda cookie sola, mismo origen).
  - `onmessage`: parsea, `setNotifications(prev => [notif, ...prev].slice(0, 50))`, `setUnreadCount(c => c+1)`.
  - `onerror`: `EventSource` reintenta solo; si falla repetido, **fallback** al poll de 30 s (degradación elegante → nunca peor que hoy).
  - Cleanup: `es.close()` al desmontar.
- Quitar el `setInterval(30000)` del camino feliz; conservarlo solo como fallback.

### F3 — Estado de no-leídas en vivo
- El badge de no-leídas sube al instante con cada push.
- `markAllAsRead` / click → ya actualizan local; añadir que el stream no re-incremente duplicados (dedupe por `_id`).
- Opcional: si hay varias pestañas, `BroadcastChannel('notifs')` para sincronizar leído/no-leído entre ellas sin N conexiones.

### F4 — Endurecimiento y escala
- **Auth/seguridad:** el stream valida sesión al abrir; cerrar si `recipientId` ≠ usuario. Filtrar SIEMPRE por `recipientId` en el `$match` (nunca emitir de otros).
- **Límite de conexiones:** 1 `EventSource` por pestaña; cerrar en `visibilitychange`/`pagehide` si se quiere ahorrar.
- **Coste Change Streams:** cada conexión = 1 cursor en Mongo. Si crecen mucho las sesiones simultáneas, migrar el puente a **Upstash Redis pub/sub** o **managed (Ably/Pusher)** SIN tocar el cliente (mismo `EventSource`/hook) — solo cambia de dónde lee la ruta SSE.
- **Fluid Compute:** confirmar que el streaming + `maxDuration` está dentro del plan; aprovechar graceful shutdown para cerrar el stream limpio.

## Prerrequisitos
- MongoDB **replica set** (Atlas ✓; Mongo local standalone NO soporta Change Streams → en local usar `mongod --replSet` o el fallback a poll).
- Verificar que Vercel mantiene la respuesta en streaming (Fluid Compute lo soporta).

## Riesgos / tradeoffs
- **Sin Atlas/replica set en local** → Change Streams falla; por eso el fallback a poll es obligatorio, no opcional.
- **Conexión cae al `maxDuration`** (300 s) → reconexión transparente de `EventSource`; el heartbeat ayuda a detectarlo.
- **Escala de cursores** → resuelto migrando el puente a pub/sub gestionado (cliente intacto).
- **No bloquea nada existente:** si el SSE falla, se cae al poll de 30 s actual → comportamiento idéntico al de hoy.

## Pruebas
- Unit: `watchUserNotifications` filtra por `recipientId` (mock change stream).
- Integración: crear `Notification` para el usuario → el `data:` llega al stream en < 1 s.
- Cliente: simular `onmessage` → prepend + `unreadCount++`; simular `onerror` → fallback a poll.
- Manual: 2 sesiones (A y B); A da like a obra de B → B ve la notificación al instante sin recargar.

## Esfuerzo estimado
- F1+F2 (MVP instantáneo con fallback): el grueso del valor.
- F3 pulido · F4 solo cuando el volumen lo pida.
