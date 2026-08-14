---
id: 0009
title: i18n mediante diccionarios asíncronos de servidor, sin librerías cliente
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0009 — i18n mediante Diccionarios Asíncronos de Servidor (Sin librerías cliente)

## Contexto
Típicamente, la internacionalización se maneja usando librerías masivas como `react-i18next` que ejecutan la traducción en tiempo de ejecución en el navegador, descargando archivos JSON kilométricos o inyectando los idiomas enteros en la estructura estática, penalizando la carga o causando "parpadeos" de traducción.

## Decisión
ArtSanctuary opta por no enviar al navegador ninguna librería externa de i18n en la vista principal y usar el siguiente flujo server-first:
1. **Middleware Router:** El archivo `middleware.ts` intercepta la petición entrante, revisa cookies o cabeceras y determina el idioma, pasando la variable local de regreso al servidor.
2. **Dynamic Imports de JSON:** En vez de importar los diccionarios, la utilidad `getDictionary` debe retornar la Promesa de un import dinámico (ej. `() => import('./locales/en.json')`). Esto evita cargar en memoria los idiomas no solicitados.
3. **Paso de Props pre-traducidos:** El *Server Component* debe ejecutar `await getDictionary()`, extraer exclusivamente el sub-árbol de cadenas necesario para esa página, e inyectarlas como simples *strings* a los componentes de UI.

## Consecuencias
- **Positivas:** El usuario experimenta la app como HTML plano y estático completamente traducido desde el frame número uno. Ahorro sustancial de red (no descarga diccionarios que no lee ni librerías de i18n cliente).
- **Negativas:** Se dificulta cambiar el idioma sobre la marcha de forma ultra-fluida ("sin recargar la página"), pero dado el caso de uso, el cambio mediante el router es aceptable a cambio del drástico aumento en performance general.
