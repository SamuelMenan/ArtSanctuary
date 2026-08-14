---
id: 0016
title: Procesamiento Pesado de Imágenes Delegado al Cliente
status: proposed
date: 2026-06-18
deciders: [TBD]
supersedes: []
superseded-by: []
---

# 0016 — Procesamiento Pesado de Imágenes Delegado al Cliente

## Contexto

El proyecto requiere extraer metadatos EXIF, recortar/redimensionar imágenes y eliminar fondos de las fotos subidas usando IA (`@imgly/background-removal`). Ejecutar estas tareas en el servidor consumiría rápidamente la memoria, el tiempo de CPU (timeouts de 10-15s) y la cuota de facturación de Vercel (Serverless Functions).

## Decisión

Todo procesamiento computacional pesado de imágenes debe ejecutarse **estrictamente en el navegador del cliente** utilizando librerías de JS (`pica`, `exifr`, `@imgly/background-removal`). El servidor o la API Route solo debe recibir la imagen final optimizada o procesada para almacenarla directamente en Vercel Blob.

## Consecuencias

- **Positivas:** Reducción drástica de costos de servidor (Zero-compute en Vercel). Tiempos de carga percibidos más rápidos si se muestra un progreso visual en la UI en lugar de esperar la red.
- **Negativas:** Dispositivos móviles de gama baja sufrirán retrasos o bloqueos de hilo principal (main thread) al ejecutar modelos de IA localmente.

## Línea de Tiempo e Intentos Fallidos (El "Cementerio de Soluciones")

⚠️ **Crucial para la IA y desarrolladores futuros:**
1. **Intento 1 (Procesamiento en Serverless):**
   - **Qué se hizo:** Se intentó procesar la imagen dentro de la API de Next.js antes de subir a Blob.
   - **Por qué falló:** Provocaba Timeouts y excedía los límites de memoria RAM asignados por Vercel para Serverless Functions estándar.

## Notas
Las dependencias que soportan esto (como `pica` y `@imgly/background-removal`) deben ser tratadas con `lazy load` en el cliente para no bloquear el First Contentful Paint.
