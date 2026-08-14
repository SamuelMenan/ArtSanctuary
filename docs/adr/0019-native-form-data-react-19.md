---
id: 0019
title: Adopción Nativa para Formularios en React 19 (Zero Zod Client)
status: proposed
date: 2026-06-18
deciders: [TBD]
supersedes: []
superseded-by: []
---

# 0019 — Adopción Nativa para Formularios en React 19 (Zero Zod Client)

## Contexto

El ecosistema tradicional de React dependía fuertemente de librerías como `react-hook-form` acopladas a validadores como `Zod` o `Yup` para enviar formularios controlados en el cliente. Esto requiere importar librerías muy pesadas en el paquete del cliente solo para enviar una petición.

## Decisión

Todos los nuevos flujos de interacción de datos deben usar el estándar de **React 19 Server Actions**. Se deben utilizar `<form action={serverAction}>` de forma nativa. La extracción de los campos se realizará usando la API nativa de JavaScript `FormData`. La validación pesada sucederá en el **Servidor**, no en el cliente.

## Consecuencias

- **Positivas:** JavaScript desactivado o fallido no impedirá el envío de formularios básicos (*Progressive Enhancement*). La carga útil en JavaScript al usuario se reduce inmensamente. 
- **Negativas:** La retroalimentación de validación inmediata (mientras el usuario teclea) es más difícil de implementar y requiere invocar acciones iterativas o validación manual extra en componentes *client* si es imperativo.

## Línea de Tiempo e Intentos Fallidos (El "Cementerio de Soluciones")

⚠️ **Crucial para la IA y desarrolladores futuros:**
1. **Intento 1 (Inputs totalmente controlados con onChange):**
   - **Qué se hizo:** Ligar cada input a un estado local y validar todo el objeto en un `useEffect`.
   - **Por qué falló:** Renders en cascada innecesarios que volvían lenta a la interfaz. Rompía con el paradigma de Server Actions forzando a crear un componente "Client" innecesariamente.
