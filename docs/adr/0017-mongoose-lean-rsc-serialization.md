---
id: 0017
title: Serialización Estricta de Mongoose con .lean() en RSC
status: proposed
date: 2026-06-18
deciders: [TBD]
supersedes: []
superseded-by: []
---

# 0017 — Serialización Estricta de Mongoose con .lean() en RSC

## Contexto

Con la llegada de React Server Components (RSC) en Next.js, ahora podemos hacer consultas a MongoDB directamente dentro del componente del servidor y pasar los datos a componentes clientes (Client Components). Sin embargo, RSC requiere que las `props` pasadas al cliente sean objetos planos serializables (Plain JSON Objects).

## Decisión

Queda **estrictamente prohibido** devolver un Documento completo de Mongoose desde cualquier servicio del backend hacia un RSC. Toda consulta de Mongoose (`find()`, `findOne()`, etc.) DEBE encadenarse obligatoriamente con `.lean()`. Adicionalmente, el campo `_id` de Mongo (que es un `ObjectId`) debe mapearse manualmente a un `String`.

## Consecuencias

- **Positivas:** Mejor rendimiento, las consultas `.lean()` son mucho más rápidas ya que evitan la hidratación interna del ODM de Mongoose. Evita errores de Next.js (`Error: Only plain objects can be passed to Client Components`).
- **Negativas:** Se pierden los getters, setters y métodos de guardado (ej. `.save()`) del modelo de Mongoose. Toda actualización debe hacerse vía `updateOne` / `findByIdAndUpdate`.

## Línea de Tiempo e Intentos Fallidos (El "Cementerio de Soluciones")

⚠️ **Crucial para la IA y desarrolladores futuros:**
1. **Intento 1 (Paso directo del documento):**
   - **Qué se hizo:** Pasar el resultado de `Model.find()` directamente a un `<ClientComponent data={result} />`.
   - **Por qué falló:** Causó un crasheo fatal de renderizado en React por objetos no serializables (`ObjectId` y el prototype inyectado de Mongoose).
