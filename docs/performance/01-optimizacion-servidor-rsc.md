---
title: "Estrategia de Rendimiento 1: Optimización de Servidor y RSC"
audience: dev
status: implemented
updated: 2026-06-01
---

# Optimización de Servidor: React Server Components y Servicios Puros

Este documento detalla la estrategia implementada en el lado del servidor (Node.js/Next.js) para reducir drásticamente el **TTFB (Time To First Byte)** y eliminar los cuellos de botella de red.

## El Problema Original: Las Cascadas de Red (Network Waterfalls)
Anteriormente, nuestras páginas de servidor obtenían los datos haciendo llamadas HTTP hacia nuestras propias rutas de API:
`page.tsx` -> `fetch('https://localhost:3000/api/boards')` -> `route.ts` -> `MongoDB`.

Esto generaba:
1. Una serialización extra (de JSON a string, y de string a JSON).
2. Tiempo de latencia por resolver la red local o infraestructura serverless.
3. Sobrecarga innecesaria en la pila HTTP.

## La Solución Aplicada
Implementamos el patrón **Controlador-Servicio** combinado con todo el poder de los **React Server Components (RSC)**.

### 1. Invocación Directa en Memoria
Ahora, la capa de enrutamiento visual (`src/app/**/page.tsx`) se salta por completo la capa HTTP. Las páginas importan e invocan directamente las funciones puras desde `src/backend/services/`.
```typescript
// ✅ AHORA: Invocación instantánea en memoria
import { getUserBoards } from "@backend/services/boards.service";

export default async function DashboardPage() {
  const boards = await getUserBoards(userId); 
  return <Dashboard boards={boards} />;
}
```

### 2. POJOs con `.lean()`
Dado que los RSC envían los props a través de la red hacia el navegador, React fallará si intentamos enviarle Clases complejas (como las instancias predeterminadas de Mongoose).
Por ello, **todos nuestros servicios finalizan sus consultas con `.lean()`**. Esto asegura que a la UI lleguen *Plain Old JavaScript Objects* (POJOs), los cuales son diminutos, instantáneos de serializar y no saturan el payload de React.

### Impacto
- **Latencia de servidor:** Reducida entre 30% y 60% por vista.
- **Consumo de Memoria:** Disminuido al no instanciar los wrappers pesados de Mongoose en consultas de solo lectura.
