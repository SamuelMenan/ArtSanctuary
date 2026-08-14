---
id: 0004
title: Hard delete de cuenta con cascada secuencial sin transacción
status: accepted
date: 2026-05-18
deciders: [equipo-core]
---

# 0004 — Hard delete de cuenta con cascada secuencial sin transacción

## Contexto

`DELETE /api/settings/account` elimina la cuenta del usuario y todos sus datos:
obras (`Artwork`), colecciones (`Collection`), notificaciones (`Notification` como
actor o recipient), y referencias en `followers/following` de otros usuarios.

MongoDB standalone (sin replica set) no soporta transacciones multi-documento.
Replica set añade complejidad operativa innecesaria en prototipo.

## Decisión

Ejecutar borrados secuencialmente en orden:
1. `Artwork.deleteMany({ artistId: userId })`
2. `Collection.deleteMany({ owner: userId })`
3. `Notification.deleteMany({ $or: [{ recipientId: userId }, { actorId: userId }] })`
4. `User.updateMany(..., { $pull: { following: userId, followers: userId } })`
5. `User.deleteOne({ _id: userId })`
6. Borrar avatar de filesystem.

Confirmación reforzada: password actual + palabra clave literal `ELIMINAR` en
body. Cliente bloquea submit, servidor revalida.

## Consecuencias

- ✅ Sin requisito de replica set.
- ✅ Confirmación doble protege contra errores accidentales.
- ❌ Sin atomicidad: si falla a mitad (caída red/DB), queda estado parcial (obras
  huérfanas con `artistId` inválido, notifs zombi).
- ❌ Recovery manual si falla. Sin grace period / soft delete previo.

## Alternativas consideradas

1. **Replica set + `session.withTransaction`** — ruta cuando el proyecto crezca.
2. **Soft delete 30 días + job purga** — más seguro UX, no implementado todavía.
3. **Outbox pattern + worker** — overkill para prototipo.

## Plan de mitigación

- Añadir `status: 'deleted'` marker temprano (ya existe en User).
- Worker job que detecte huérfanos y los limpie.
- Eventualmente migrar a soft delete con TTL.

## Notas

- Implementación: `src/app/api/settings/account/route.ts`.
- Confirmación: constante compartida `CONFIRM_WORD = 'ELIMINAR'`.
