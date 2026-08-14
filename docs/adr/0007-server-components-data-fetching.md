---
id: 0007
title: Data fetching mediante React Server Components y llamadas puras a servicios
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0007 — Data Fetching mediante React Server Components (RSC) y llamadas puras a Servicios

## Contexto
En arquitecturas tradicionales de Next.js, se solía crear una ruta de API (`/api/boards`) y hacer un `fetch` desde el cliente o incluso desde `getServerSideProps` mediante HTTP. Esto generaba problemas de "Network Waterfalls" (Cascadas de red) locales y sobrecargas de serialización doble (BSON a JSON a Texto a Objeto).

## Decisión
Hemos estandarizado que el enrutamiento visual de la aplicación (`src/app/**/page.tsx`) sea servido mediante **React Server Components (RSC)**, y que **se elimine el uso de rutas API internas para la carga inicial de datos**.
1. En lugar de hacer un `fetch` HTTP a nuestros propios endpoints, los RSC deben **importar y ejecutar directamente las funciones de la capa de servicio backend** (ej. `import { getUserBoards } from "@backend/services/boards.service"`).
2. Para evitar que React intente serializar instancias de Mongoose hacia el cliente, todas las consultas a la base de datos que se vayan a pasar como *props* deben finalizar obligatoriamente con el método `.lean()` para que retornen un POJO (Plain Old JavaScript Object).

## Consecuencias
- **Positivas:** Latencia drásticamente reducida. Menor consumo de RAM en servidor (gracias a `.lean()`). Código de fetching más limpio sin necesidad de hooks en cliente para la carga inicial.
- **Negativas:** La IA o desarrolladores inexpertos pueden olvidar añadir `.lean()` causando un crash por serialización en Next.js. Las páginas deben manejarse puramente asíncronas (`async function Page()`).
